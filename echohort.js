/* =====================================================================
   ECHOS HORT – Raubzug, Wildgestalt und der Zorn des Hains
   Neun Gebiete wie in der Kampagne (Wald an der Straße, Phandalin,
   Wachturm, magische Schmiede, Donnerbaum, Unterreich, See der Kuo-Toa,
   Gracklstugh, Themberchauds Hort), je drei Level, danach geht es endlos weiter.
   Jedes Level hat zwei Phasen:
   1. Raubzug: Echo schleudert seine Ranke in die Tiefe und zieht Gold,
      Edelsteine, Truhen und die Ressource des Gebiets hoch. Mit
      Wildgestalt wird er zum Raben (schnell, nur Leichtes), Bären
      (zieht alles, sprengt Felsen) oder später zur Ratte (durch Netze).
      Steine und Tiere ärgern ihn: Ist der Zorn voll, passiert etwas
      Unberechenbares (Feuerball, Blitz, Bärenwut – oder er schmollt).
      Gier: Je mehr Beute, desto höher der Punktefaktor, aber desto mehr
      Plünderer kommen.
   2. Der Zorn des Hains: Tower Defense um den Hort. Die Ressource wird zu
      Wächtern gepflanzt (Dornen, Wurzeln, Wölfe, Eis, Sturmeiche,
      Pilzring), Echo wirft selbst Feuerbälle. Voller Zorn = Bärengestalt,
      die Gegner zermalmt und dabei eigene Wächter zertrampelt.
   Dazwischen: Echos Hain mit vielen dauerhaften Verbesserungen.
   Spielstand wird nach jedem Level gespeichert. Bestenliste wie bei den
   anderen Spielen (Supabase-Tabelle hort_bestenliste, sonst nur hier).
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("echohort");
  if (!root) return;

  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const zw = (a, b) => a + Math.random() * (b - a);
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const loesch = k => { try { localStorage.removeItem(k); } catch (_) {} };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mischen = l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  const abst = (a, b, c, d) => Math.hypot(a - c, b - d);

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Druiden-Probe", titel: "Echos Hort",
      text: "Echo schleudert seine Ranke in die Tiefe, verwandelt sich in Rabe, Bär oder Ratte und rafft zusammen, was glänzt. Danach kommen die Plünderer, und der Hain muss den Hort verteidigen. Neun Gebiete wie in unserer Kampagne, viele Level, noch mehr Verbesserungen.",
      steuerung: "Raubzug: Tippe, um die Ranke zu schleudern, die Knöpfe unten verwandeln Echo. Abwehr: Tippe auf einen Pflanzplatz, um einen Wächter wachsen zu lassen, und irgendwo auf die Karte für einen Feuerball.",
      neu: "▶ Neuer Raubzug", fortsetzen: (g, l) => "▶ Fortsetzen · " + g + " " + l + "/3", fortsetzenEndlos: n => "▶ Fortsetzen · Endlos, Runde " + n,
      weiter: "▶ Weiter", los: "▶ Los!", nochmal: "↻ Neuer Raubzug", beenden: "Raubzug beenden", zumHain: "▶ In den Hain", zurAbwehr: "▶ Den Hort verteidigen", nochmalLevel: "↻ Level wiederholen",
      neuWarnung: "Dein gespeicherter Raubzug geht dabei verloren.",
      pause: "Echo grummelt", pauseText: "Er wartet. Ungeduldig. Aber er wartet.", pauseKnopf: "Pause",
      ton: ["🔊 Ton an", "🔈 Ton aus"],
      stufenTitel: "Schwierigkeit", stufen: { lehrling: "Lehrling", druide: "Druide", erzdruide: "Erzdruide" },
      stufenText: { lehrling: "Mehr Zeit, weniger Zorn, schwächere Plünderer, vier Leben.", druide: "So, wie Echo es kennt. Drei Leben.", erzdruide: "Weniger Zeit, zähe Plünderer, schneller Zorn, zwei Leben." },
      gebiete: [
        ["Der Wald an der Straße", "Hinter dem Hinterhalt liegt die Goblinhöhle. Goblins horten erstaunlich viel Kram. Echo nimmt ihn ihnen ab."],
        ["Phandalin", "Ein Dorf in den Fängen der Roten Roben. Unter ihren Kellern liegt mehr Silber, als ein Dorf haben sollte."],
        ["Der Wachturm", "Ein Bugbear bewacht die Gefangenen, und in den Gewölben glitzert es. Hier hat Echo seinen Eisfächer gelernt zu schätzen."],
        ["Die magische Schmiede", "Tief in der alten Mine glühen Runen und Erz. Echo streicht über den Amboss, behutsamer als über Gold. Fast."],
        ["Donnerbaum", "Ein verlassenes Dorf voller Blights, Zombies und eines Giftdrachen auf einem Schatz. Feuerball-Wetter."],
        ["Das Unterreich", "Gefesselt im Kerker. Doch Echo erinnert sich: Als Ratte kommt man überall durch. Durch Ketten. Durch Netze."],
        ["Der See der Kuo-Toa", "Unter der Wasseroberfläche liegen Perlen und Opfergaben. Und tief unten schläft etwas mit zwei Köpfen."],
        ["Gracklstugh", "Die Festung der Duergar. Schmiedegold, Glut und ein Riese, der Stimmen hört."],
        ["Themberchauds Hort", "Eine Halle aus Glut, Lava an allen Rändern, in der Mitte ein Berg aus Gold. Echo rechnet schon, was er sich davon kaufen könnte. Und während er rechnet, schleichen die Grauen Geister zu seinem eigenen Hort."]
      ],
      endlosName: "Der endlose Raubzug", endlosText: n => "Runde " + n + ": Echo kennt jeden Schatz. Die Plünderer kennen Echo.",
      levelKurz: (g, l) => g + " · Level " + l + "/3", levelEndlos: n => "Endlos · Runde " + n,
      neuFreigeschaltet: "Neu:",
      phase: { raub: "Raubzug", abwehr: "Der Zorn des Hains" },
      raubIntro: "Tippe, um die Ranke zu schleudern. Steine und Tiere ärgern Echo.",
      abwehrIntro: "Tippe auf einen leuchtenden Pflanzplatz, um einen Wächter wachsen zu lassen. Tippe auf die Karte für Echos Zauber. Doppeltipp pflanzt oder verstärkt sofort.",
      hud: { zorn: "Zorn", gier: "Gier", saat: "Saat", hort: "Hort", genug: "Genug!", wild: "Wildgestalt", feuerball: "Echos Zauber", gegner: "Plünderer" },
      formen: {
        ranke: ["Ranke", "Zieht alles, nur Felsen nicht."],
        rabe: ["Rabe", "Blitzschnell, aber nur Leichtes."],
        baer: ["Bär", "Zieht alles. Sprengt Felsen."],
        ratte: ["Ratte", "Nagt sich durch Netze."]
      },
      dinge: { muenze: "Münzen", beutel: "Goldbeutel", nugget: "Goldklumpen", edelstein: "Edelstein", stein: "Stein", truhe: "Truhe" },
      res: ["Eicheln", "Gartenkräuter", "Turmmoos", "Leuchtkristalle", "Wurzelholz", "Sporenpilze", "Muscheln", "Feuermoos", "Drachenpfeffer"],
      relikt: ["Goblin-Krone", "Silberkelch", "Drow-Amulett", "Runenhammer", "Drachenschuppe", "Spinnenidol", "Kuo-Toa-Perle", "Duergar-Krone", "Faustgroße Drachenmünze"],
      ev: {
        naturfrevel: "Die Natur grollt!", gekappt: "Ranke gekappt!", mimik: "Ein Mimik! Hmpf.", zuSchwer: "Zu schwer für den Raben!",
        fels: "Fels! Nur ein Bär …", netz: "Netz! Nur eine Ratte …", wildPlus: "+1 Wildgestalt", keineWild: "Keine Wildgestalt mehr!",
        gier: n => "Gier ×" + n + "!", zeitUm: "Die Dämmerung endet", alles: "Alles geplündert!"
      },
      ausbruch: { feuerball: "FEUERBALL!", blitz: "BLITZ!", baer: "BÄRENWUT!", grummeln: "Hmpf. Echo schmollt.", feuersturm: "FEUERSTURM!" },
      ausbruchTipp: "Der Zorn ist voll. Bei Echo weiß man nie, was jetzt passiert …",
      kommen: n => "Die Plünderer kommen in " + n + " …", jetzt: "Sofort kommen lassen", bereitLos: "Bereit – los geht's!", klaut: n => "−" + n + " Gold",
      bossRuft: { anfuehrer: "Der Goblin-Anführer!", glasstab: "Glasstab, Anführer der Roten Roben!", bugbaer: "Der Bugbear vom Wachturm!", nezna: "Nezna, die Drow!", venomfang: "Venomfang!", vrock: "Ein Vrock!", demogorgon: "DEMOGORGON!", riese: "Der rasende Riese!", drokey: "Drokey, der Meisterdieb!" },
      demo: { text: "Demogorgon ist nicht zu besiegen. Halte ihn auf, bis er im See versinkt!", weg: "Demogorgon versinkt im See …", schrei: "Sein Schrei lässt die Magie erlöschen!" },
      neznaFlieht: "Nezna wird zur Fledermaus!", drokeyWeg: "Drokey entwischt durch einen Geheimgang – aber ohne Echos Gold!", gift: "Giftatem!", wurf: "Felswurf!", netzTreffer: "Eingesponnen!", geheimgang: "Geheimgang!",
      wachter: {
        dorn: ["Dornenranke", "Schießt Dornen auf einen Gegner."],
        wurzel: ["Wurzelgriff", "Bremst alle in der Nähe."],
        wolf: ["Wolfsbau", "Die befreiten Wölfe beißen zu – nur Gegner am Boden."],
        eis: ["Eisfächer", "Frost trifft alle in der Nähe."],
        blitz: ["Sturmeiche", "Blitze springen von Gegner zu Gegner."],
        pilz: ["Pilzring", "Giftsporen für alle in der Nähe."]
      },
      bau: { stufe: n => "Stufe " + n, verstaerken: "▲ Stärker", ausreissen: "✕ Ausreißen", max: "Volle Kraft", waehle: "Welcher Wächter soll hier wachsen?", zuwenig: "Zu wenig Saat", pflanzen: "Pflanzen", stufeVon: n => "Stufe " + n + "/3",
        werte: { schaden: "Schaden", reich: "Reichweite", tempo: "Tempo" }, proSek: n => n + "/s", giftProSek: n => n + "/s Gift",
        spez: {
          dorn: (w, st) => "Ein Ziel: immer das vorderste. Trifft auch Fliegende.",
          wurzel: (w, st) => "Alle in Reichweite · bremst um " + Math.round((1 - w.bremse[st]) * 100) + " %" + (st >= 2 ? " · hält fest" : "") + " · Blights sind immun",
          wolf: (w, st) => w.ziele[st] + (w.ziele[st] > 1 ? " Wölfe" : " Wolf") + " · beißt den Nächsten, kommt zurück",
          eis: (w, st) => "Bis zu " + w.ziele[st] + " Splitter · bremst um " + Math.round((1 - w.bremse[st]) * 100) + " %",
          blitz: (w, st) => "Springt auf " + w.ziele[st] + " Ziele, jedes Mal etwas schwächer",
          pilz: (w, st) => w.ziele[st] + " Sporenbälle · vergiften alle im Umkreis für 3 s"
        },
        kombo: { wurzel: "Kombo: Wölfe beißen Verwurzelte doppelt.", wolf: "Kombo: beißt Verwurzelte doppelt.", eis: "Kombo: Blitze treffen Gefrorene ×1,5.", blitz: "Kombo: ×1,5 gegen Gefrorene.", pilz: "Kombo: Feuer lässt Vergiftete explodieren." } },
      gesperrt: "Gesperrt",
      raubFertig: "Der Raubzug ist vorbei",
      raubWerte: { beute: "Beute", gier: "Gier", saat: "Saat", schaetze: "Schätze" },
      gierWarnung: n => n ? "Die Gier lockt " + n + " zusätzliche Plünderer an." : "Noch lockt die Beute niemanden extra an.",
      sicher: "Der Hort ist sicher!", verloren: "Der Hort ist leer!", verlorenText: l => l > 0 ? "Echo verliert ein Leben (" + l + " übrig). Er versucht es noch einmal – grummelnd." : "Echo hat keine Leben mehr.",
      ergWerte: { beutel: "Für den Hain", gesichert: "Gesichertes Gold", gier: "Gierfaktor", erlegt: "Erledigte Plünderer", punkte: "Punkte" },
      hain: "Echos Hain", hainText: "Hier wächst, was Echo stärker macht. Bezahlt wird mit Gold. Er tut es ungern.",
      beutel: n => n + " Gold im Beutel", kaufen: n => n + " Gold", max: "voll",
      hainGruppen: { raub: "Raubzug", wesen: "Gemüt", abwehr: "Abwehr", besonders: "Besonderes" },
      feinde: { goblin: "Goblin", rotrobe: "Rote Robe", bandit: "Bandit", bugbear: "Bugbear", soeldner: "Söldner", zombie: "Zombie", blight: "Blight", spinne: "Riesenspinne", drow: "Drow", ettercap: "Ettercap", chasme: "Chasme", kuotoa: "Kuo-Toa", duergar: "Duergar", graugeist: "Grauer Geist", glutkaefer: "Glutkäfer", flammenwahrer: "Bewahrer der Flamme",
        anfuehrer: "Goblin-Anführer", glasstab: "Glasstab", bugbaer: "Der Bugbear vom Wachturm", nezna: "Nezna", venomfang: "Venomfang", vrock: "Vrock", demogorgon: "Demogorgon", riese: "Der rasende Riese", drokey: "Drokey, der Meisterdieb" },
      eig: { flug: "fliegt", schnell: "schnell", zaeh: "zäh", ausweichen: "weicht aus", unsichtbar: "zeitweise unsichtbar", netz: "spinnt Wächter ein", feuerSchwach: "feuerschwach", wurzelFest: "wurzelfest",
        ruft: "ruft Verstärkung", blinzeln: "nimmt Geheimgänge", gift: "Giftatem lähmt Wächter", schrei: "Schrei lähmt Wächter", wurf: "wirft Felsen auf Wächter", verwandeln: "flieht als Fledermaus", unbesiegbar: "unbesiegbar – nur aufhalten!" },
      zweige: {
        dorn: { a: ["Giftdorn", "Dornen vergiften ihr Ziel."], b: ["Dornenhagel", "Schießt auf drei Gegner zugleich."] },
        wurzel: { a: ["Würgewurzel", "Hält Gegner länger fest, selbst Bosse kurz."], b: ["Dornenwurzeln", "Doppelter Schaden; Getroffene nehmen 3 s lang 25 % mehr Schaden."] },
        wolf: { a: ["Rudel", "Drei Wölfe auf einmal."], b: ["Alphawolf", "Ein riesiger Wolf: dreifacher Biss, der betäubt."] },
        eis: { a: ["Permafrost", "Splitter frieren Gegner kurz ein."], b: ["Splitterregen", "Splitter zerspringen auf zwei weitere Gegner."] },
        blitz: { a: ["Gewitter", "Springt auf bis zu sieben Ziele."], b: ["Donnerschlag", "Ein Ziel, dreifacher Schaden, betäubt."] },
        pilz: { a: ["Seuche", "Wer am Gift stirbt, steckt seine Nachbarn an."], b: ["Riesenbovist", "Größere Giftwolken, die zusätzlich bremsen."] }
      },
      weg: "Auf Stufe 3 wählst du einen Weg:", uralt: "Stufe 4 „Uralt“: deutlich mehr Schaden und Reichweite.", zielmodus: { vorne: "🎯 Vorderster", stark: "🎯 Stärkster", nah: "🎯 Nächster" },
      tiere: {
        baer: ["Bär", "Stellt sich auf den Weg und hält Plünderer auf."],
        eule: ["Eule", "Wächter in ihrer Nähe sehen weiter. Enthüllt Unsichtbare."],
        hirsch: ["Hirsch", "Wächter in seiner Nähe feuern schneller."],
        keiler: ["Keiler", "Stürmt den Weg entlang und wirft Plünderer zurück."],
        falke: ["Falke", "Jagt Flieger und Diebe überall auf der Karte."],
        dachs: ["Dachs", "Gräbt Fallen in den Weg, die Plünderer festhalten."]
      },
      tierFaehig: {
        baer: ["Hält 2 Plünderer fest, Prankenhieb. Schläft sich nach einer Niederlage gesund.", "Hält 3 Plünderer fest, härtere Hiebe, mehr Leben, schläft kürzer."],
        eule: ["Reichweite +20 % im Umkreis, enthüllt Unsichtbare, Flieger nehmen 30 % mehr Schaden.", "Reichweite +30 %, größerer Umkreis."],
        hirsch: ["Tempo +25 % im Umkreis, alle 10 s ein Geweihstoß.", "Tempo +40 %, Geweihstoß alle 7 s."],
        keiler: ["Alle 9 s ein Ansturm über 150 Schritt.", "Alle 7 s, längerer und härterer Ansturm."],
        falke: ["Alle 4,5 s ein Sturzflug, doppelter Schaden gegen Flieger, holt Beutel zurück.", "Alle 3 s, härtere Krallen."],
        dachs: ["Alle 7 s eine Falle, bis zu 3 gleichzeitig.", "Alle 5 s, bis zu 4 Fallen, härter."]
      },
      tab: { waechter: "🌿 Wächter", tiere: "🐾 Tiere", setz: n => "🌱 " + n },
      frei: "frei", maxTier: "max", schlaeft: "schläft …", benommen: "benommen …", stufeHoch: n => "Stufe " + n + "!",
      setzHinweis: "Neues Gebiet! Deine Wächter warten als Setzlinge – „Wie zuletzt“ pflanzt sie so wie im letzten Gebiet.",
      gartenHinweis: "Deine Wächter und Tiere bleiben stehen. Jede Welle wird härter.",
      welle: (n, m) => "Welle " + n + "/" + m, welleIn: (n, m, sek) => "Welle " + n + "/" + m + " in " + sek + " …", welleBereit: (n, m) => "Welle " + n + "/" + m + " – starte, wenn du bereit bist", welleGeschafft: "Welle geschafft!", rufen: n => "Welle rufen +" + n + " 🌱",
      druide: { knopf: "🌙 Druidenkreis", titel: "Der Druidenkreis", text: "Mondsteine bleiben über alle Raubzüge hinweg erhalten. Für jedes gewonnene Level gibt es einen, für Bosse und neue Sterne mehr.", steine: n => "🌙 " + n + " Mondsteine", voll: "gemeistert", verdient: n => "+" + n + " 🌙" },
      talente: {
        boden: ["Fruchtbarer Boden", "+15 Saat zu Beginn jedes Levels."], saatgut: ["Gutes Saatgut", "Wächter kosten 6 % weniger."],
        tierfreund: ["Tierfreund", "Von jedem Tier darf ein zweites in den Garten."], wildnis: ["Ruf der Wildnis", "Tiere sind 15 % stärker."],
        mondsegen: ["Mondsegen", "Zauber laden 8 % schneller."], zaeh: ["Zähe Haut", "+1 Leben zu Beginn eines Raubzugs."], raubzug: ["Wilder Raubzug", "+1 Wildgestalt im Raubzug."]
      },
      besonderheit: "Besonderheit:",
      einst: { titel: "Einstellungen", knopf: "⚙ Einstellungen", effekte: "🔊 Effekte", musik: "🎵 Musik", vib: "📳 Vibration", vibNein: "Dieses Gerät oder dieser Browser kann nicht vibrieren.", aus: "aus" },
      schatzkammer: "🏛 Schatzkammer", schatzTitel: "Echos Schatzkammer", schatzText: "Jedes Gebiet versteckt ein Relikt. Echo hebt sie alle auf. Natürlich.",
      reliktAnzahl: n => "×" + n, unbekannt: "Noch nicht gefunden", trophaeen: "Trophäen", neuesRelikt: "Neues Relikt für die Schatzkammer!", trophaee: "Trophäe!",
      erfolge: {
        erster: ["Erste Beute", "Den ersten Raubzug abgeschlossen."], relikt1: ["Sammler", "Das erste Relikt gefunden."], relikt8: ["Echos Schatzkammer", "Ein Relikt aus jedem Gebiet."],
        beute1000: ["Goldrausch", "1000 Gold in einem einzigen Raubzug."], gier5: ["Unersättlich", "Gier ×1,75 in einem Raubzug."], zorn3: ["Vulkan", "Drei Zornausbrüche in einem Raubzug."],
        kombo: ["Druidenkunst", "50 Kombo-Treffer."], rex: ["Guter Hund", "Rex hat 5 Goldbeutel zurückgeholt."], ezekiel: ["Schattenfreund", "Ezekiel hat 25 Plünderer gemeuchelt."],
        sparsam: ["Mit leichter Hand", "Ein Level ab Phandalin mit höchstens zwei Wächtern gewonnen."], bosse: ["Bezwinger", "Jeden besiegbaren Boss einmal besiegt."], demo: ["Nicht heute, Demogorgon", "Demogorgon überstanden, ohne Gold zu verlieren."],
        kampagne: ["Die ganze Kampagne", "Alle Gebiete geschafft."], endlos5: ["Kein Ende in Sicht", "Endlos-Runde 5 erreicht."], sterne: ["Sternensammler", "Die Hälfte aller Sterne einer Schwierigkeit."],
        alleSterne: ["Perfektion", "Alle Sterne einer Schwierigkeit."], hain: ["Voller Hain", "Jede Verbesserung im Hain gekauft."]
      },
      zauber: {
        feuerball: ["Feuerball", "Explodiert am Ziel. Vergiftete Gegner explodieren mit."],
        eissturm: ["Eissturm", "Friert alle im Umkreis kurz ein."],
        mondstrahl: ["Mondstrahl", "Ein Lichtkegel verbrennt Gegner und enthüllt Unsichtbare."],
        adler: ["Adlergestalt", "Echo stößt als Adler über die Karte und reißt Dieben die Beute ab."],
        erdbeben: ["Erdbeben", "Schüttelt alle Gegner am Boden durch und bremst sie."]
      },
      zauberWahl: "Zauber für die Abwehr – wähle zwei", kombo: "Kombo!", sporenExplosion: "Sporenexplosion!",
      regeln: {
        goblindieb: ["Goblin-Diebe", "Goblins schleichen herein und tragen Schätze davon. Pack sie mit der Ranke, dann lassen sie alles fallen!"],
        laterne: ["Die Wache der Roten Roben", "Wachen mit Laternen patrouillieren durch die Keller. Gerät die Ranke in ihr Licht, ist der Wurf verloren und Zeit dazu."],
        bugbear: ["Der schlafende Bugbear", "Ein Bugbear schläft neben einem Teil des Schatzes. Steine, Fehlwürfe und Würfe in seine Nähe machen Lärm. Wacht er auf, kostet das Beute."],
        loren: ["Die Loren der Mine", "Auf den Schienen rollen Loren mit Erz und Kristallen vorbei. Pass den richtigen Moment ab!"],
        venomfang: ["Venomfang schläft", "Der Giftdrache schläft auf seinem Hort. Jeder Griff in seinen Schatz weckt ihn ein Stück mehr, bis er Gift speit."],
        dunkel: ["Die Dunkelheit", "Im Unterreich siehst du nur, was Echos Stab, die Leuchtpilze und die Ranke selbst erhellen."],
        stroemung: ["Die Strömung", "Die Beute treibt mit der Strömung durch das Wasser."],
        geysir: ["Lavageysire", "Glühende Risse kündigen Lavafontänen an. Was dort liegt, schmilzt, und auch die Ranke verbrennt sich."],
        lavastrom: ["Die Lavaströme", "Zwei Lavaströme ziehen quer durch die Halle. Wenn sie aufwallen, verbrennt jede Ranke, die hindurchreicht, und das Treibgut darin schmilzt. Unten wartet der Goldberg – mehr wert, aber hinter beiden Strömen."]
      },
      rev: { erwischt: "Erwischt!", goblinFlieht: "Husch! +15", goblinWeg: "Ein Goblin entkommt mit Beute!", wache: "Die Wache sieht dich! −3 s", bugbearWach: n => "Der Bugbear erwacht! −" + n + " Gold",
        drache: "Venomfang erwacht! Giftatem!", gift: "Gift! −2 s", geschmolzen: "Geschmolzen!", verbrannt: "Autsch! Verbrannt!", wallt: "Die Lava wallt auf!",
        rechnet: ["Das reicht für ein Schiff …", "… und ein Schloss. Zwei Schlösser!", "Ein goldener Hund? Rex wird eifersüchtig.", "Davon kauf ich den ganzen Markt der Klingen.", "Kennt der Drache Gundren? Egal. Meins.", "Drei Wagenladungen. Mindestens.", "Was glänzt, gehört Echo."] },
      vorschau: "Es kommen", traegt: n => "+" + n + " zurück!", entkommt: n => "−" + n + " Gold entkommen!", leer: "Nichts mehr da!",
      raubHinweis: "Wer Gold stiehlt, rennt damit zum Eingang zurück. Halte ihn auf, dann ist es wieder deins!",
      schnell: ["⏩ ×2", "⏩ ×3", "▶ ×1"],
      wieZuletzt: "↺ Wie zuletzt", zurueckBeutel: "↩ in den Beutel", gefahr: "Nächste Welle",
      zinsenText: n => "🐿 Ungenutzte Saat bringt nach der Welle +" + n + " 🌱 Zinsen", zinsen: n => "+" + n + " 🌱 Zinsen",
      erspart: n => "🐿 Ersparnis: +" + n + " 🌱 fürs nächste Level", ersparnisStart: n => "🐿 +" + n + " 🌱 Ersparnis", ersparnisWert: "Ersparnis",
      elite: "Elite", eliteArt: { panzer: "gepanzert", flink: "flink", teilung: "teilt sich", heilung: "heilt sich", schild: "mit Schild" },
      launeTitel: "Wetter",
      launen: {
        nebel: ["Nebel", "Plünderer tasten sich 15 % langsamer voran", "Wächter sehen 15 % weniger weit"],
        gewitter: ["Gewitter", "Blitzwächter +50 % Schaden, Blitze schlagen in Plünderer ein", "Plünderer haben 12 % mehr Leben"],
        vollmond: ["Vollmond", "Tiere kämpfen 50 % stärker", "Zauber laden 30 % langsamer"],
        frost: ["Frost", "Eiswächter +35 % Schaden, Kälte bremst länger", "Dornen und Wölfe schießen langsamer"],
        duerre: ["Dürre", "Pilze +50 % Schaden", "Wurzeln reichen 25 % weniger weit"],
        regen: ["Regen", "Wurzeln +30 % Reichweite und +20 % Schaden", "Zauber 30 % schwächer"],
        goldrausch: ["Goldrausch", "+50 % Saat und +30 % Punkte", "35 % mehr Plünderer"],
        sturm: ["Sturm", "Flieger 35 % langsamer", "Alle Wächter schießen 12 % langsamer"],
        nacht: ["Neumond", "+25 % Saat", "Doppelt so viele Elite-Gegner"]
      },
      kleinodTitel: "Beute des Bosses", kleinodText: "Wähle ein Kleinod. Es begleitet dich für den Rest des Raubzugs.", kleinodKnopf: "☠ Beute wählen", kleinodeLabel: "Kleinode:",
      kleinod: {
        giftdorn: ["Natternzahn", "Dornen vergiften ihr Ziel zusätzlich"], rudel: ["Rudelhorn", "Wölfe +50 % Schaden"],
        frostherz: ["Frostherz", "Eis +20 % Schaden, Kälte hält 50 % länger"], donnerhall: ["Donnerhall", "Blitzketten springen auf 2 Gegner mehr"],
        pilzring: ["Hexenring", "Pilze +30 % Schaden und größere Wolken"], wurzelherz: ["Wurzelherz", "Wurzeln +25 % Reichweite"],
        falkenauge: ["Falkenauge", "Alle Wächter +10 % Reichweite"], zunder: ["Zunderbüchse", "Zauber 20 % schneller bereit und 25 % stärker"],
        wildherz: ["Wildherz", "Tiere +35 % Kraft"], saatbeutel: ["Saatbeutel", "+25 % Saat von erlegten Plünderern"],
        sparstrumpf: ["Sparstrumpf", "Zinsen und Ersparnis +75 %"], schatzwacht: ["Schatzwacht", "+60 Gold Notreserve im Hort"],
        kleeblatt: ["Vierblatt", "Elite-Gegner bringen doppelte Beute"], uraltrinde: ["Uralte Rinde", "Stufe 4 kostet 25 % weniger"]
      },
      tag: { knopf: "📅 Tagesherausforderung", titel: "Tagesherausforderung", text: "Jeden Tag eine neue Prüfung: dieselbe Karte, dieselben Gegner, dasselbe Wetter für alle. Ohne Hain und ohne Garten – nur dein Geschick zählt.",
        heute: d => "Heute · " + d, dabei: "Kleinode für heute:", best: n => "Dein Bestes heute: " + n + " Punkte", liste: "Bestenliste von heute", punkte: "Punkte",
        nochmal: "↻ Nochmal versuchen", zumStart: "← Zum Start", verloren: "Der Hort ist gefallen – aber jede erlegte Bande zählt.", geschafft: "Hort gehalten!", start: "▶ Antreten", leer: "Heute hat sich noch niemand eingetragen. Sei die Erste oder der Erste!" },
      helfer: { rex: "Rex!", rexText: "Wuff! Weg da!", rexSack: "Rex schnappt sich den Beutel!", barradin: "Barradin spielt auf!", barradinText: "Die Wächter tanzen im Takt.", ezekiel: "Ezekiel!", ezekielText: "Aus den Schatten …" },
      sterne: { sieg: "Hort verteidigt", alles: "Kein Gold entkommen", gier: "Gier ×1,45 oder mehr" },
      levelwahl: "★ Level wählen", levelwahlTitel: "Level wählen", levelwahlText: "Spiel ein Level noch einmal und hol dir mehr Sterne. Echos Hain ist dabei so weit gewachsen wie in deinem besten Raubzug.",
      zurLevelwahl: "★ Zur Levelwahl", zurueck: "← Zurück", einzelLabel: "Einzelnes Level", sterneGesamt: (n, m) => "★ " + n + " von " + m,
      up: {
        ranke: ["Lange Ranke", "Die Ranke reicht weiter."],
        zug: ["Starke Ranke", "Zieht schneller hoch."],
        zeit: ["Lange Dämmerung", "+5 Sekunden Raubzug."],
        wild: ["Wildgestalt", "+1 Verwandlung pro Raubzug."],
        dauer: ["Tiergedächtnis", "Gestalten halten einen Wurf länger."],
        goldnase: ["Goldnase", "Schätze sind 10 % mehr wert."],
        rabenauge: ["Rabenauge", "Echo sieht, was in Truhen steckt."],
        grummeln: ["Grummeln", "Der Zorn steigt langsamer."],
        wildherz: ["Wildes Herz", "Zornausbrüche gehen öfter gut aus."],
        feuer: ["Großer Feuerball", "Mehr Schaden, größerer Radius."],
        funken: ["Funkenflug", "Feuerball lädt schneller."],
        ernte: ["Reiche Ernte", "Mehr Saat zu Beginn und aus Funden."],
        notgroschen: ["Notgroschen", "+30 Gold Reserve im Hort."],
        baerenkraft: ["Bärenkraft", "Der Bär trifft härter und trampelt weniger."],
        heilkraut: ["Heilkräuter", "+1 Leben."],
        doppelgriff: ["Doppelgriff", "Die Ranke packt zwei Dinge auf einmal, wenn sie nah beieinander liegen."],
        sanft: ["Zahmer Bär", "Echos Bärenwut bringt keine Wächter mehr aus dem Takt."],
        freunde: ["Gute Freunde", "Rex, Barradin und Ezekiel kommen öfter vorbei."]
      },
      leben: n => "❤ " + n,
      endeTitel: "Echos Raubzug endet", sieg: "Die ganze Kampagne geplündert!", siegText: "Alle neun Gebiete. Und Echo will trotzdem mehr. Ab jetzt geht es endlos weiter.",
      punkte: "Punkte",
      wert: { level: "Level", gold: "Gold gesamt", erlegt: "Plünderer", schaetze: "Schätze" },
      spruch: {
        schwach: ["Hmpf. Das war ein Probelauf.", "Ich hatte heute keinen Hunger auf Gold.", "Die Goblins hatten Glück. Diesmal."],
        mittel: ["Nicht schlecht. Nicht genug.", "Das Gold ist gezählt. Zweimal.", "Barradin bekommt nichts davon. Vielleicht ein bisschen."],
        gut: ["Mein Hort wächst. Gut so.", "Wer an mein Gold geht, wird Asche.", "Die Natur gibt. Ich nehme."],
        boss: ["Der Schatz des Drachen ist jetzt meiner.", "Zwei Köpfe, ein Feuerball. Hmpf.", "Und wieder bin ich es, der aufräumt."],
        legende: ["Alles meins. Fast alles. Na gut, wir teilen.", "Selbst Demogorgon hat mich nicht beeindruckt.", "Es gibt kein Gold, das ich nicht finde."]
      },
      bestenliste: "Größte Horte", spalten: ["#", "Name", "Punkte", "Level"], leer: "Noch hat niemand einen Hort angelegt. Sei der Erste!", nurHier: "Gerade nur auf diesem Gerät gespeichert.",
      deinName: "Dein Name", eintragen: "Eintragen", eingetragen: p => "Eingetragen auf Platz " + p + "!", eingetragenOhne: "Eingetragen!", sendet: "Wird eingetragen …",
      fehler: { "Bitte freundlich bleiben": "Dieser Name ist leider nicht erlaubt – bitte wähle einen anderen.", "Bitte kurz warten": "Zu viele Einträge in kurzer Zeit – bitte später nochmal.",
        "Bitte später nochmal": "Zu viele Einträge in kurzer Zeit – bitte später nochmal.", "Name fehlt": "Bitte gib einen Namen ein.",
        "falscher Tag": "Diese Tagesaufgabe ist schon vorbei – dein Ergebnis bleibt auf diesem Gerät.",
        netz: "Server nicht erreichbar – nur auf diesem Gerät gespeichert.", endgueltig: "Eintrag hat nicht geklappt – dein Ergebnis bleibt auf diesem Gerät.", _: "Eintrag hat nicht geklappt – bitte versuch es nochmal." },
      rekord: (p, s) => "Bester Hort (" + s + "): " + p, neuRekord: "Neuer Rekord!",
      quips: {
        gold: ["Meins.", "Glänzt.", "Mehr!", "Hübsch.", "In den Beutel."],
        stein: ["Stein. Natürlich.", "Hmpf.", "Wer legt hier Steine hin?", "Grrr."],
        tier: ["Verzeih, kleiner Freund.", "Das war keine Absicht!", "Lauf, Kleiner."],
        zorn: ["Jetzt reicht's!", "GRRR!", "Ich zähl bis drei …"],
        boss: ["Komm nur.", "Noch einer, der mein Gold will.", "Du bist zu nah an meinem Hort."]
      }
    },
    en: {
      label: "Druid check", titel: "Echo's Hoard",
      text: "Echo hurls his vine into the depths, turns into raven, bear or rat and grabs whatever glitters. Then the plunderers come, and the grove must defend the hoard. Nine regions like in our campaign, many levels, even more upgrades.",
      steuerung: "Raid: tap to hurl the vine, the buttons below transform Echo. Defence: tap a planting spot to grow a guardian, and anywhere on the map for a fireball.",
      neu: "▶ New raid", fortsetzen: (g, l) => "▶ Continue · " + g + " " + l + "/3", fortsetzenEndlos: n => "▶ Continue · Endless, round " + n,
      weiter: "▶ Continue", los: "▶ Go!", nochmal: "↻ New raid", beenden: "End raid", zumHain: "▶ To the grove", zurAbwehr: "▶ Defend the hoard", nochmalLevel: "↻ Retry level",
      neuWarnung: "Your saved raid will be lost.",
      pause: "Echo grumbles", pauseText: "He waits. Impatiently. But he waits.", pauseKnopf: "Pause",
      ton: ["🔊 Sound on", "🔈 Sound off"],
      stufenTitel: "Difficulty", stufen: { lehrling: "Apprentice", druide: "Druid", erzdruide: "Archdruid" },
      stufenText: { lehrling: "More time, less rage, weaker plunderers, four lives.", druide: "The way Echo knows it. Three lives.", erzdruide: "Less time, tough plunderers, quick rage, two lives." },
      gebiete: [
        ["The forest by the road", "Past the ambush lies the goblin cave. Goblins hoard a surprising amount of stuff. Echo takes it off their hands."],
        ["Phandalin", "A village in the grip of the Redbrands. Beneath their cellars lies more silver than any village should have."],
        ["The watchtower", "A bugbear guards the prisoners, and something glitters in the vaults. This is where Echo learned to love his ice fan."],
        ["The magic forge", "Deep in the old mine, runes and ore are glowing. Echo strokes the anvil more gently than gold. Almost."],
        ["Thundertree", "An abandoned village full of blights, zombies and a poison dragon sitting on a treasure. Fireball weather."],
        ["The Underdark", "Shackled in a dungeon. But Echo remembers: as a rat you get through anything. Chains. Webs."],
        ["The lake of the Kuo-toa", "Beneath the surface lie pearls and offerings. And deep below sleeps something with two heads."],
        ["Gracklstugh", "The fortress of the duergar. Forge gold, embers and a giant who hears voices."],
        ["Themberchaud's hoard", "A hall of embers, lava along every edge, a mountain of gold in the middle. Echo is already working out what he could buy with it. And while he counts, the Grey Ghosts creep towards his own hoard."]
      ],
      endlosName: "The endless raid", endlosText: n => "Round " + n + ": Echo knows every treasure. The plunderers know Echo.",
      levelKurz: (g, l) => g + " · Level " + l + "/3", levelEndlos: n => "Endless · Round " + n,
      neuFreigeschaltet: "New:",
      phase: { raub: "Raid", abwehr: "Wrath of the grove" },
      raubIntro: "Tap to hurl the vine. Stones and animals annoy Echo.",
      abwehrIntro: "Tap a glowing planting spot to grow a guardian. Tap the map for Echo's spell. Double-tap plants or upgrades at once.",
      hud: { zorn: "Rage", gier: "Greed", saat: "Seeds", hort: "Hoard", genug: "Enough!", wild: "Wild shape", feuerball: "Echo's spells", gegner: "Plunderers" },
      formen: {
        ranke: ["Vine", "Pulls anything except boulders."],
        rabe: ["Raven", "Lightning fast, light things only."],
        baer: ["Bear", "Pulls anything. Smashes boulders."],
        ratte: ["Rat", "Gnaws through webs."]
      },
      dinge: { muenze: "Coins", beutel: "Gold pouch", nugget: "Gold nugget", edelstein: "Gem", stein: "Stone", truhe: "Chest" },
      res: ["Acorns", "Garden herbs", "Tower moss", "Glow crystals", "Rootwood", "Spore mushrooms", "Shells", "Fire moss", "Dragon peppers"],
      relikt: ["Goblin crown", "Silver chalice", "Drow amulet", "Rune hammer", "Dragon scale", "Spider idol", "Kuo-toa pearl", "Duergar crown", "Fist-sized dragon coin"],
      ev: {
        naturfrevel: "Nature is angry!", gekappt: "Vine cut!", mimik: "A mimic! Hmph.", zuSchwer: "Too heavy for the raven!",
        fels: "Boulder! Only a bear …", netz: "Web! Only a rat …", wildPlus: "+1 wild shape", keineWild: "No wild shapes left!",
        gier: n => "Greed ×" + n + "!", zeitUm: "Dusk is over", alles: "All plundered!"
      },
      ausbruch: { feuerball: "FIREBALL!", blitz: "LIGHTNING!", baer: "BEAR RAGE!", grummeln: "Hmph. Echo sulks.", feuersturm: "FIRESTORM!" },
      ausbruchTipp: "His rage is full. With Echo you never know what happens next …",
      kommen: n => "The plunderers arrive in " + n + " …", jetzt: "Bring them on now", bereitLos: "Ready – let's go!", klaut: n => "−" + n + " gold",
      bossRuft: { anfuehrer: "The goblin boss!", glasstab: "Glasstaff, leader of the Redbrands!", bugbaer: "The bugbear of the watchtower!", nezna: "Nezna the drow!", venomfang: "Venomfang!", vrock: "A vrock!", demogorgon: "DEMOGORGON!", riese: "The raging giant!", drokey: "Drokey, the master thief!" },
      demo: { text: "Demogorgon cannot be defeated. Hold him off until he sinks back into the lake!", weg: "Demogorgon sinks into the lake …", schrei: "His scream snuffs out all magic!" },
      neznaFlieht: "Nezna turns into a bat!", drokeyWeg: "Drokey slips away through a secret passage – but without Echo's gold!", gift: "Poison breath!", wurf: "Boulder throw!", netzTreffer: "Webbed!", geheimgang: "Secret passage!",
      wachter: {
        dorn: ["Thorn vine", "Shoots thorns at one enemy."],
        wurzel: ["Root grip", "Slows everyone nearby."],
        wolf: ["Wolf den", "The freed wolves bite – ground enemies only."],
        eis: ["Ice fan", "Frost hits everyone nearby."],
        blitz: ["Storm oak", "Lightning jumps from foe to foe."],
        pilz: ["Mushroom ring", "Poison spores for everyone nearby."]
      },
      bau: { stufe: n => "Level " + n, verstaerken: "▲ Stronger", ausreissen: "✕ Uproot", max: "Full strength", waehle: "Which guardian shall grow here?", zuwenig: "Not enough seeds", pflanzen: "Plant", stufeVon: n => "Level " + n + "/3",
        werte: { schaden: "Damage", reich: "Range", tempo: "Speed" }, proSek: n => n + "/s", giftProSek: n => n + "/s poison",
        spez: {
          dorn: (w, st) => "One target: always the one in front. Hits flyers too.",
          wurzel: (w, st) => "Everyone in range · slows by " + Math.round((1 - w.bremse[st]) * 100) + " %" + (st >= 2 ? " · roots them" : "") + " · blights are immune",
          wolf: (w, st) => w.ziele[st] + (w.ziele[st] > 1 ? " wolves" : " wolf") + " · bites the nearest, comes back",
          eis: (w, st) => "Up to " + w.ziele[st] + " shards · slows by " + Math.round((1 - w.bremse[st]) * 100) + " %",
          blitz: (w, st) => "Jumps to " + w.ziele[st] + " targets, a little weaker each time",
          pilz: (w, st) => w.ziele[st] + " spore balls · poison everyone nearby for 3 s"
        },
        kombo: { wurzel: "Combo: wolves bite rooted foes twice as hard.", wolf: "Combo: double bite against rooted foes.", eis: "Combo: lightning hits frozen foes ×1.5.", blitz: "Combo: ×1.5 against frozen foes.", pilz: "Combo: fire makes poisoned foes explode." } },
      gesperrt: "Locked",
      raubFertig: "The raid is over",
      raubWerte: { beute: "Loot", gier: "Greed", saat: "Seeds", schaetze: "Treasures" },
      gierWarnung: n => n ? "Greed lures " + n + " extra plunderers." : "The loot doesn't lure anyone extra yet.",
      sicher: "The hoard is safe!", verloren: "The hoard is empty!", verlorenText: l => l > 0 ? "Echo loses a life (" + l + " left). He tries again – grumbling." : "Echo has no lives left.",
      ergWerte: { beutel: "For the grove", gesichert: "Gold secured", gier: "Greed factor", erlegt: "Plunderers stopped", punkte: "Points" },
      hain: "Echo's grove", hainText: "Here grows what makes Echo stronger. Paid for in gold. He does it reluctantly.",
      beutel: n => n + " gold in the pouch", kaufen: n => n + " gold", max: "maxed",
      hainGruppen: { raub: "Raid", wesen: "Temper", abwehr: "Defence", besonders: "Special" },
      feinde: { goblin: "Goblin", rotrobe: "Redbrand", bandit: "Bandit", bugbear: "Bugbear", soeldner: "Mercenary", zombie: "Zombie", blight: "Blight", spinne: "Giant spider", drow: "Drow", ettercap: "Ettercap", chasme: "Chasme", kuotoa: "Kuo-toa", duergar: "Duergar", graugeist: "Grey Ghost", glutkaefer: "Fire beetle", flammenwahrer: "Keeper of the Flame",
        anfuehrer: "Goblin boss", glasstab: "Glasstaff", bugbaer: "The watchtower bugbear", nezna: "Nezna", venomfang: "Venomfang", vrock: "Vrock", demogorgon: "Demogorgon", riese: "The raging giant", drokey: "Drokey, the master thief" },
      eig: { flug: "flies", schnell: "fast", zaeh: "tough", ausweichen: "dodges", unsichtbar: "sometimes invisible", netz: "webs guardians", feuerSchwach: "weak to fire", wurzelFest: "root-proof",
        ruft: "calls for help", blinzeln: "uses secret passages", gift: "poison breath stuns guardians", schrei: "scream stuns guardians", wurf: "throws boulders at guardians", verwandeln: "flees as a bat", unbesiegbar: "invincible – just hold him off!" },
      zweige: {
        dorn: { a: ["Poison thorn", "Thorns poison their target."], b: ["Thorn hail", "Shoots at three enemies at once."] },
        wurzel: { a: ["Strangling root", "Holds enemies longer, even bosses briefly."], b: ["Thorn roots", "Double damage; hit enemies take 25 % more damage for 3 s."] },
        wolf: { a: ["Pack", "Three wolves at once."], b: ["Alpha wolf", "One huge wolf: triple bite that stuns."] },
        eis: { a: ["Permafrost", "Shards briefly freeze enemies."], b: ["Shard rain", "Shards burst onto two more enemies."] },
        blitz: { a: ["Thunderstorm", "Jumps to up to seven targets."], b: ["Thunderclap", "One target, triple damage, stuns."] },
        pilz: { a: ["Plague", "Whoever dies of poison infects their neighbours."], b: ["Giant puffball", "Bigger poison clouds that also slow."] }
      },
      weg: "At level 3 you choose a path:", uralt: "Level 4 “Ancient”: much more damage and range.", zielmodus: { vorne: "🎯 First", stark: "🎯 Strongest", nah: "🎯 Closest" },
      tiere: {
        baer: ["Bear", "Stands on the road and holds plunderers back."],
        eule: ["Owl", "Guardians nearby see further. Reveals the invisible."],
        hirsch: ["Stag", "Guardians nearby attack faster."],
        keiler: ["Boar", "Charges along the road and knocks plunderers back."],
        falke: ["Falcon", "Hunts flyers and thieves anywhere on the map."],
        dachs: ["Badger", "Digs traps into the road that hold plunderers."]
      },
      tierFaehig: {
        baer: ["Holds 2 plunderers, paw swipe. Sleeps off a defeat.", "Holds 3 plunderers, harder swipes, more life, sleeps less."],
        eule: ["Range +20 % nearby, reveals the invisible, flyers take 30 % more damage.", "Range +30 %, bigger area."],
        hirsch: ["Speed +25 % nearby, an antler strike every 10 s.", "Speed +40 %, antler strike every 7 s."],
        keiler: ["A charge over 150 steps every 9 s.", "Every 7 s, longer and harder charge."],
        falke: ["A dive every 4.5 s, double damage against flyers, brings pouches back.", "Every 3 s, sharper talons."],
        dachs: ["A trap every 7 s, up to 3 at once.", "Every 5 s, up to 4 traps, harder."]
      },
      tab: { waechter: "🌿 Guardians", tiere: "🐾 Animals", setz: n => "🌱 " + n },
      frei: "free", maxTier: "max", schlaeft: "sleeping …", benommen: "dazed …", stufeHoch: n => "Level " + n + "!",
      setzHinweis: "New region! Your guardians wait as seedlings – “As before” replants them like in the last region.",
      gartenHinweis: "Your guardians and animals stay. Every wave gets harder.",
      welle: (n, m) => "Wave " + n + "/" + m, welleIn: (n, m, sek) => "Wave " + n + "/" + m + " in " + sek + " …", welleBereit: (n, m) => "Wave " + n + "/" + m + " – start when ready", welleGeschafft: "Wave cleared!", rufen: n => "Call wave +" + n + " 🌱",
      druide: { knopf: "🌙 Druid circle", titel: "The druid circle", text: "Moonstones stay with you across all raids. Every won level earns one, bosses and new stars earn more.", steine: n => "🌙 " + n + " moonstones", voll: "mastered", verdient: n => "+" + n + " 🌙" },
      talente: {
        boden: ["Fertile soil", "+15 seeds at the start of every level."], saatgut: ["Good seed", "Guardians cost 6 % less."],
        tierfreund: ["Animal friend", "A second animal of each kind may join the garden."], wildnis: ["Call of the wild", "Animals are 15 % stronger."],
        mondsegen: ["Moon blessing", "Spells recharge 8 % faster."], zaeh: ["Tough skin", "+1 life at the start of a raid."], raubzug: ["Wild raid", "+1 wild shape in the raid."]
      },
      besonderheit: "Special:",
      einst: { titel: "Settings", knopf: "⚙ Settings", effekte: "🔊 Effects", musik: "🎵 Music", vib: "📳 Vibration", vibNein: "This device or browser cannot vibrate.", aus: "off" },
      schatzkammer: "🏛 Treasury", schatzTitel: "Echo's treasury", schatzText: "Every region hides a relic. Echo keeps them all. Of course.",
      reliktAnzahl: n => "×" + n, unbekannt: "Not found yet", trophaeen: "Trophies", neuesRelikt: "New relic for the treasury!", trophaee: "Trophy!",
      erfolge: {
        erster: ["First loot", "Finished the first raid."], relikt1: ["Collector", "Found the first relic."], relikt8: ["Echo's treasury", "A relic from every region."],
        beute1000: ["Gold rush", "1000 gold in a single raid."], gier5: ["Insatiable", "Greed ×1.75 in a raid."], zorn3: ["Volcano", "Three rage outbursts in one raid."],
        kombo: ["Druidcraft", "50 combo hits."], rex: ["Good boy", "Rex brought back 5 gold pouches."], ezekiel: ["Friend of shadows", "Ezekiel assassinated 25 plunderers."],
        sparsam: ["Light touch", "Won a level from Phandalin on with at most two guardians."], bosse: ["Conqueror", "Defeated every beatable boss once."], demo: ["Not today, Demogorgon", "Survived Demogorgon without losing gold."],
        kampagne: ["The whole campaign", "Finished every region."], endlos5: ["No end in sight", "Reached endless round 5."], sterne: ["Star collector", "Half of all stars on one difficulty."],
        alleSterne: ["Perfection", "All stars on one difficulty."], hain: ["Full grove", "Bought every upgrade in the grove."]
      },
      zauber: {
        feuerball: ["Fireball", "Explodes at the target. Poisoned enemies explode too."],
        eissturm: ["Ice storm", "Briefly freezes everyone in the area."],
        mondstrahl: ["Moonbeam", "A beam of light burns enemies and reveals the invisible."],
        adler: ["Eagle form", "Echo swoops across the map as an eagle and snatches loot from thieves."],
        erdbeben: ["Earthquake", "Shakes and slows every enemy on the ground."]
      },
      zauberWahl: "Spells for the defence – choose two", kombo: "Combo!", sporenExplosion: "Spore blast!",
      regeln: {
        goblindieb: ["Goblin thieves", "Goblins sneak in and carry treasures away. Grab them with the vine and they drop everything!"],
        laterne: ["The Redbrand watch", "Guards with lanterns patrol the cellars. If the vine enters their light, the throw is lost and so is time."],
        bugbear: ["The sleeping bugbear", "A bugbear sleeps next to part of the treasure. Stones, misses and throws near him make noise. If he wakes up, it costs loot."],
        loren: ["The mine carts", "Carts full of ore and crystals roll past on the rails. Time it right!"],
        venomfang: ["Venomfang sleeps", "The poison dragon sleeps on his hoard. Every grab from his treasure wakes him a little more, until he breathes poison."],
        dunkel: ["The darkness", "In the Underdark you only see what Echo's staff, the glowing mushrooms and the vine itself light up."],
        stroemung: ["The current", "The loot drifts through the water with the current."],
        geysir: ["Lava geysers", "Glowing cracks announce lava fountains. Whatever lies there melts, and the vine gets burned too."],
        lavastrom: ["The lava streams", "Two lava streams cross the hall. When they surge, any vine reaching through them burns, and the flotsam in them melts. Down below waits the mountain of gold – worth more, but behind both streams."]
      },
      rev: { erwischt: "Caught!", goblinFlieht: "Scram! +15", goblinWeg: "A goblin escapes with loot!", wache: "The guard spots you! −3 s", bugbearWach: n => "The bugbear wakes up! −" + n + " gold",
        drache: "Venomfang wakes! Poison breath!", gift: "Poison! −2 s", geschmolzen: "Melted!", verbrannt: "Ouch! Burned!", wallt: "The lava surges!",
        rechnet: ["That buys a ship …", "… and a castle. Two castles!", "A golden dog? Rex will be jealous.", "I could buy the whole Market of Blades.", "Does the dragon know Gundren? Never mind. Mine.", "Three cartloads. At least.", "What glitters belongs to Echo."] },
      vorschau: "Coming", traegt: n => "+" + n + " back!", entkommt: n => "−" + n + " gold escaped!", leer: "Nothing left!",
      raubHinweis: "Whoever steals gold runs back to the entrance with it. Stop them and it's yours again!",
      schnell: ["⏩ ×2", "⏩ ×3", "▶ ×1"],
      wieZuletzt: "↺ As before", zurueckBeutel: "↩ back to pouch", gefahr: "Next wave",
      zinsenText: n => "🐿 Unspent seeds earn +" + n + " 🌱 interest after the wave", zinsen: n => "+" + n + " 🌱 interest",
      erspart: n => "🐿 Savings: +" + n + " 🌱 for the next level", ersparnisStart: n => "🐿 +" + n + " 🌱 savings", ersparnisWert: "Savings",
      elite: "Elite", eliteArt: { panzer: "armoured", flink: "swift", teilung: "splits", heilung: "regenerates", schild: "shielded" },
      launeTitel: "Weather",
      launen: {
        nebel: ["Fog", "Plunderers grope 15% slower", "Guardians see 15% less far"],
        gewitter: ["Thunderstorm", "Lightning guardians +50% damage, bolts strike plunderers", "Plunderers have 12% more health"],
        vollmond: ["Full moon", "Animals fight 50% harder", "Spells recharge 30% slower"],
        frost: ["Frost", "Ice guardians +35% damage, cold slows longer", "Thorns and wolves fire slower"],
        duerre: ["Drought", "Mushrooms +50% damage", "Roots reach 25% less far"],
        regen: ["Rain", "Roots +30% range and +20% damage", "Spells 30% weaker"],
        goldrausch: ["Gold rush", "+50% seeds and +30% points", "35% more plunderers"],
        sturm: ["Storm", "Flyers 35% slower", "All guardians fire 12% slower"],
        nacht: ["New moon", "+25% seeds", "Twice as many elite enemies"]
      },
      kleinodTitel: "The boss's loot", kleinodText: "Pick a trinket. It stays with you for the rest of the raid.", kleinodKnopf: "☠ Choose loot", kleinodeLabel: "Trinkets:",
      kleinod: {
        giftdorn: ["Viper fang", "Thorns also poison their target"], rudel: ["Pack horn", "Wolves +50% damage"],
        frostherz: ["Frost heart", "Ice +20% damage, cold lasts 50% longer"], donnerhall: ["Thunder echo", "Lightning chains jump to 2 more enemies"],
        pilzring: ["Fairy ring", "Mushrooms +30% damage and bigger clouds"], wurzelherz: ["Root heart", "Roots +25% range"],
        falkenauge: ["Hawk eye", "All guardians +10% range"], zunder: ["Tinderbox", "Spells ready 20% sooner and 25% stronger"],
        wildherz: ["Wild heart", "Animals +35% strength"], saatbeutel: ["Seed pouch", "+25% seeds from slain plunderers"],
        sparstrumpf: ["Nest egg", "Interest and savings +75%"], schatzwacht: ["Hoard ward", "+60 gold emergency reserve in the hoard"],
        kleeblatt: ["Four-leaf clover", "Elite enemies drop double loot"], uraltrinde: ["Ancient bark", "Level 4 costs 25% less"]
      },
      tag: { knopf: "📅 Daily challenge", titel: "Daily challenge", text: "A new trial every day: the same map, the same enemies, the same weather for everyone. No grove, no garden – only your skill counts.",
        heute: d => "Today · " + d, dabei: "Today's trinkets:", best: n => "Your best today: " + n + " points", liste: "Today's leaderboard", punkte: "points",
        nochmal: "↻ Try again", zumStart: "← To the start", verloren: "The hoard has fallen – but every slain gang counts.", geschafft: "Hoard held!", start: "▶ Step up", leer: "Nobody has entered today yet. Be the first!" },
      helfer: { rex: "Rex!", rexText: "Woof! Get lost!", rexSack: "Rex grabs the pouch!", barradin: "Barradin strikes up!", barradinText: "The guardians dance to the beat.", ezekiel: "Ezekiel!", ezekielText: "From the shadows …" },
      sterne: { sieg: "Hoard defended", alles: "No gold escaped", gier: "Greed ×1.45 or more" },
      levelwahl: "★ Choose level", levelwahlTitel: "Choose level", levelwahlText: "Play a level again and earn more stars. Echo's grove has grown as far as in your best raid.",
      zurLevelwahl: "★ Back to levels", zurueck: "← Back", einzelLabel: "Single level", sterneGesamt: (n, m) => "★ " + n + " of " + m,
      up: {
        ranke: ["Long vine", "The vine reaches further."],
        zug: ["Strong vine", "Pulls up faster."],
        zeit: ["Long dusk", "+5 seconds of raiding."],
        wild: ["Wild shape", "+1 transformation per raid."],
        dauer: ["Animal memory", "Shapes last one throw longer."],
        goldnase: ["Gold nose", "Treasures are worth 10 % more."],
        rabenauge: ["Raven eye", "Echo sees what's inside chests."],
        grummeln: ["Grumbling", "Rage rises more slowly."],
        wildherz: ["Wild heart", "Rage outbursts turn out well more often."],
        feuer: ["Great fireball", "More damage, bigger radius."],
        funken: ["Flying sparks", "Fireball recharges faster."],
        ernte: ["Rich harvest", "More seeds at the start and from finds."],
        notgroschen: ["Nest egg", "+30 gold reserve in the hoard."],
        baerenkraft: ["Bear strength", "The bear hits harder and tramples less."],
        heilkraut: ["Healing herbs", "+1 life."],
        doppelgriff: ["Double grip", "The vine grabs two things at once when they lie close together."],
        sanft: ["Tame bear", "Echo's bear rage no longer throws guardians off their rhythm."],
        freunde: ["Good friends", "Rex, Barradin and Ezekiel drop by more often."]
      },
      leben: n => "❤ " + n,
      endeTitel: "Echo's raid ends", sieg: "The whole campaign plundered!", siegText: "All nine regions. And Echo still wants more. From now on it goes on endlessly.",
      punkte: "points",
      wert: { level: "Level", gold: "Total gold", erlegt: "Plunderers", schaetze: "Treasures" },
      spruch: {
        schwach: ["Hmph. That was a practice run.", "I wasn't hungry for gold today.", "The goblins got lucky. This time."],
        mittel: ["Not bad. Not enough.", "The gold has been counted. Twice.", "Barradin gets none of it. Maybe a little."],
        gut: ["My hoard grows. Good.", "Whoever touches my gold becomes ash.", "Nature gives. I take."],
        boss: ["The dragon's treasure is mine now.", "Two heads, one fireball. Hmph.", "And once again I'm the one cleaning up."],
        legende: ["All mine. Almost all. Fine, we share.", "Not even Demogorgon impressed me.", "There's no gold I can't find."]
      },
      bestenliste: "Greatest hoards", spalten: ["#", "Name", "Points", "Level"], leer: "Nobody has built a hoard yet. Be the first!", nurHier: "Only saved on this device right now.",
      deinName: "Your name", eintragen: "Enter", eingetragen: p => "Entered at rank " + p + "!", eingetragenOhne: "Entered!", sendet: "Submitting …",
      fehler: { "Bitte freundlich bleiben": "That name isn't allowed – please choose another one.", "Bitte kurz warten": "Too many entries in a short time – please try again later.",
        "Bitte später nochmal": "Too many entries in a short time – please try again later.", "Name fehlt": "Please enter a name.",
        "falscher Tag": "This daily challenge is already over – your score stays on this device.",
        netz: "Server unreachable – saved on this device only.", endgueltig: "Submitting didn't work – your score stays on this device.", _: "Submitting didn't work – please try again." },
      rekord: (p, s) => "Best hoard (" + s + "): " + p, neuRekord: "New record!",
      quips: {
        gold: ["Mine.", "Shiny.", "More!", "Pretty.", "Into the pouch."],
        stein: ["A stone. Of course.", "Hmph.", "Who puts stones here?", "Grrr."],
        tier: ["Sorry, little friend.", "That wasn't on purpose!", "Run, little one."],
        zorn: ["That's enough!", "GRRR!", "I'll count to three …"],
        boss: ["Come on then.", "Another one after my gold.", "You're too close to my hoard."]
      }
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Spielfeld & Daten ---------- */
  const W = 400, H = 500;
  const FONT_D = '"IM Fell English SC", "Palatino Linotype", Georgia, serif';
  const FONT_H = 'Caveat, "Segoe Print", cursive';
  const FONT_B = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const LEISTE = 448;            // ab hier: Knopfleiste unten
  const DREH = { x: 200, y: 98 }; // Drehpunkt der Ranke
  const HORT = { x: 200, y: 412 };
  const LEVEL_PRO_GEBIET = 3;

  const STUFEN = {
    lehrling:  { zeit: 1.18, hp: 0.78, zorn: 0.8, leben: 4, tempo: 0.92 },
    druide:    { zeit: 1, hp: 1, zorn: 1, leben: 3, tempo: 1 },
    erzdruide: { zeit: 0.88, hp: 1.3, zorn: 1.2, leben: 2, tempo: 1.08 }
  };
  let stufeWahl = STUFEN[lies("imres-echohort-stufe", "")] ? lies("imres-echohort-stufe", "") : "druide";

  /* Gebiete: Farben, Ressource, Tiere, Störenfriede, Gegner, Boss */
  /* ===== DIE GEBIETE =====
     Neues Kampagnengebiet? Einfach hier einen Eintrag anhängen und in TX (de/en) bei gebiete, res und relikt
     je einen Eintrag ergänzen. Levelzahl, Levelwahl, Sterne, Endlosmodus und Bestenliste passen sich an.
     k: Kennung · stil: Aussehen (horizont: tannen | daecher | turm | hoehle | ufer | halle, deko: baeume | haeuser | steine,
     res: Form der Ressource) · regel: Besonderheit im Raubzug (siehe REGELN) · musik: Musikprofil (siehe GEBIET_MUSIK)
     relikt: Form des Relikts · tier / stoerer: Tiere und Störenfriede im Raubzug · gegner: Plünderer mit Anteil · boss
     f: Farben */
  const GEB = [
    { k: "wald", stil: { ambient: "gluehwurm", horizont: "tannen", wurzeln: true, deko: "baeume", res: "eicheln" }, regel: "goblindieb", musik: "wald",
      relikt: "krone", tier: "hase", stoerer: "wespe", gegner: [["goblin", 1]], boss: "anfuehrer",
      f: { himmel: ["#0c1110", "#1a2620"], boden: ["#2a2117", "#16110c"], akzent: "#4d6b35", stein: "#5d574c", res: "#a8783e", weg: "#4a3a26", gras: "#1d2a1a" } },
    { k: "phandalin", stil: { ambient: "blatt", horizont: "daecher", deko: "haeuser", res: "kraeuter" }, regel: "laterne", musik: "dorf",
      relikt: "kelch", tier: "hase", stoerer: "wespe", gegner: [["goblin", 0.3], ["rotrobe", 0.7]], boss: "glasstab",
      f: { himmel: ["#120d10", "#2a1a1a"], boden: ["#2b221c", "#151010"], akzent: "#9b3a2f", stein: "#625a52", res: "#6f8a5a", weg: "#57483a", gras: "#232a1c", mauer: true } },
    { k: "wachturm", stil: { ambient: "nebel", horizont: "turm", deko: "steine", res: "moos" }, regel: "bugbear", musik: "turm",
      relikt: "amulett", tier: "fledermaus", stoerer: "spinne", gegner: [["goblin", 0.55], ["bandit", 0.45]], boss: "bugbaer",
      f: { himmel: ["#0c0c14", "#1c1c28"], boden: ["#26252a", "#121216"], akzent: "#6a6a86", stein: "#5a5866", res: "#5f8a4a", weg: "#3b3a40", gras: "#1d221c", mauer: true } },
    { k: "schmiede", stil: { ambient: "glut", horizont: "hoehle", deko: "steine", res: "kristalle" }, regel: "loren", musik: "schmiede",
      relikt: "hammer", tier: "fledermaus", stoerer: "spinne", gegner: [["soeldner", 0.6], ["goblin", 0.25], ["bugbear", 0.15]], boss: "nezna",
      f: { himmel: ["#0d0b0a", "#1e1712"], boden: ["#2d241b", "#120e0a"], akzent: "#e0a046", stein: "#5b5249", res: "#7fd6e0", weg: "#3d3024", gras: "#221b14", schienen: true } },
    { k: "donnerbaum", stil: { ambient: "gluehwurm", horizont: "tannen", tanne: "#141a14", wurzeln: true, knochen: true, deko: "baeume", res: "wurzelholz" }, regel: "venomfang", musik: "donnerbaum",
      relikt: "schuppe", tier: "hase", stoerer: "spinne", gegner: [["blight", 0.55], ["zombie", 0.3], ["spinne", 0.15]], boss: "venomfang",
      f: { himmel: ["#0b100c", "#18231a"], boden: ["#231d16", "#100c09"], akzent: "#6f9a3a", stein: "#55524a", res: "#8a6440", weg: "#3d3324", gras: "#1a2416" } },
    { k: "unterreich", stil: { ambient: "spore", horizont: "hoehle", deko: "steine", res: "sporen" }, regel: "dunkel", musik: "unterreich",
      relikt: "idol", tier: "fledermaus", stoerer: "spinne", gegner: [["drow", 0.45], ["ettercap", 0.3], ["chasme", 0.25]], boss: "vrock",
      f: { himmel: ["#07060c", "#120f1c"], boden: ["#1b1724", "#0b0910"], akzent: "#8a6ad0", stein: "#4a4458", res: "#c49ae0", weg: "#2b2536", gras: "#161320", pilze: true } },
    { k: "see", stil: { ambient: "blase", horizont: "ufer", res: "muscheln" }, regel: "stroemung", musik: "see",
      relikt: "perle", tier: "fisch", stoerer: "aal", gegner: [["kuotoa", 1]], boss: "demogorgon",
      f: { himmel: ["#06090e", "#0e1824"], boden: ["#0f2230", "#06101a"], akzent: "#4aa0b0", stein: "#3d4c58", res: "#e8c8b0", weg: "#2a3a44", gras: "#10202a", wasser: true } },
    { k: "gracklstugh", stil: { ambient: "glut", horizont: "hoehle", glut: true, deko: "steine", res: "feuermoos" }, regel: "geysir", musik: "gracklstugh",
      relikt: "krone", tier: "fledermaus", stoerer: "spinne", gegner: [["duergar", 0.75], ["bugbear", 0.25]], boss: "riese",
      f: { himmel: ["#0e0808", "#24120c"], boden: ["#2a1a14", "#120a08"], akzent: "#e0602a", stein: "#584a44", res: "#ff8a3a", weg: "#3a2a22", gras: "#22140f", lava: true } },
    /* Themberchauds Halle: Lava an allen Rändern, in der Mitte der Goldberg. Der Drache schaut nur zu. */
    { k: "hort", stil: { ambient: "glut", horizont: "halle", glut: true, deko: "steine", res: "pfeffer", lavarand: true }, regel: "lavastrom", musik: "hort",
      relikt: "drachenmuenze", tier: "salamander", stoerer: "rauch", gegner: [["graugeist", 0.5], ["glutkaefer", 0.25], ["flammenwahrer", 0.25]], boss: "drokey",
      f: { himmel: ["#140806", "#3a140a"], boden: ["#34180e", "#140806"], akzent: "#ff7a2a", stein: "#5e4238", res: "#e0402a", weg: "#40261a", gras: "#2a120a", lava: true } }
  ];
  const GEBIETE_ANZAHL = GEB.length, KAMPAGNE = GEBIETE_ANZAHL * LEVEL_PRO_GEBIET;

  /* Gegner der Abwehr. hp/tempo/klau werden mit dem Level hochskaliert. */
  const FEINDE = {
    goblin:   { hp: 30, v: 44, klau: 8, r: 8, pkt: 5, farbe: "#6b7d3e" },
    rotrobe:  { hp: 62, v: 36, klau: 12, r: 9, pkt: 8, farbe: "#8a2f26" },
    bandit:   { hp: 56, v: 38, klau: 12, r: 9, pkt: 8, farbe: "#6b4a30" },
    bugbear:  { hp: 130, v: 26, klau: 25, r: 12, pkt: 20, farbe: "#a8783e" },
    soeldner: { hp: 66, v: 32, klau: 15, r: 10, pkt: 10, farbe: "#7a7f86" },
    zombie:   { hp: 105, v: 17, klau: 15, r: 10, pkt: 10, farbe: "#6a7a5c" },
    blight:   { hp: 36, v: 50, klau: 6, r: 7, pkt: 5, farbe: "#5a4630", feuerSchwach: true, wurzelFest: true },
    spinne:   { hp: 58, v: 42, klau: 10, r: 10, pkt: 10, farbe: "#2a2226", netz: true },
    drow:     { hp: 62, v: 36, klau: 14, r: 9, pkt: 12, farbe: "#3b2f4a", ausweichen: 0.2 },
    ettercap: { hp: 74, v: 30, klau: 12, r: 10, pkt: 12, farbe: "#58505a", netz: true },
    chasme:   { hp: 58, v: 36, klau: 20, r: 11, pkt: 15, farbe: "#3a4560", flug: true },
    kuotoa:   { hp: 72, v: 31, klau: 15, r: 10, pkt: 12, farbe: "#3f7a78" },
    duergar:  { hp: 78, v: 30, klau: 18, r: 10, pkt: 14, farbe: "#6a6460", unsichtbar: true },
    graugeist:     { hp: 56, v: 48, klau: 24, r: 8, pkt: 13, farbe: "#55555f", unsichtbar: true, ausweichen: 0.15 },
    glutkaefer:    { hp: 88, v: 34, klau: 10, r: 9, pkt: 11, farbe: "#7a2a14" },
    flammenwahrer: { hp: 120, v: 27, klau: 20, r: 10, pkt: 17, farbe: "#8a2418" },
    // Bosse
    anfuehrer: { hp: 430, v: 24, klau: 60, r: 15, pkt: 100, farbe: "#5d6e35", boss: true, ruft: "goblin" },
    glasstab:  { hp: 580, v: 22, klau: 70, r: 14, pkt: 120, farbe: "#9b3a2f", boss: true, blinzeln: true },
    bugbaer:   { hp: 950, v: 20, klau: 80, r: 17, pkt: 150, farbe: "#a8783e", boss: true, bild: "bugbear.jpg", bildY: 0.3 },
    nezna:     { hp: 920, v: 28, klau: 80, r: 14, pkt: 160, farbe: "#4a3a66", boss: true, verwandeln: true },
    venomfang: { hp: 1550, v: 19, klau: 110, r: 20, pkt: 220, farbe: "#4d7a3a", boss: true, bild: "venomfang.jpg", bildY: 0.32, gift: true },
    vrock:     { hp: 1500, v: 26, klau: 110, r: 18, pkt: 220, farbe: "#8a8070", boss: true, bild: "vrock.jpg", bildY: 0.28, flug: true },
    demogorgon:{ hp: 1, v: 8.5, klau: 99999, r: 24, pkt: 500, farbe: "#9b3a2f", boss: true, bild: "demogorgon-karte.webp", bildY: 0.3, unbesiegbar: true, schrei: true },
    riese:     { hp: 1800, v: 13, klau: 220, r: 22, pkt: 350, farbe: "#7a6a5a", boss: true, bild: "portrait-riese.jpg", bildY: 0.5, wurf: true },
    drokey:    { hp: 1600, v: 25, klau: 240, r: 17, pkt: 380, farbe: "#4a4a56", boss: true, blinzeln: true, unsichtbar: true }
  };

  /* Wächter (Türme). ab = ab welchem Level (Index) verfügbar */
  const WACHTER = {
    dorn:   { ab: 0,  sym: "🌿", kosten: [30, 45, 85, 260], reich: [74, 82, 92, 100], schaden: [10, 17, 27, 38], rate: 0.6, typ: "schuss", farbe: "#6f9a3a" },
    wurzel: { ab: 0,  sym: "🌳", kosten: [35, 50, 85, 260], reich: [62, 68, 76, 82], schaden: [5, 8, 12, 17], rate: 1.7, typ: "puls", bremse: [0.55, 0.45, 0.32, 0.3], bremsT: 1.6, farbe: "#8a6440" },
    wolf:   { ab: 2,  sym: "🐺", kosten: [45, 60, 95, 280], reich: [58, 62, 68, 74], schaden: [32, 50, 74, 104], rate: 1.05, typ: "biss", ziele: [1, 1, 2, 2], farbe: "#a89f8f" },
    eis:    { ab: 6,  sym: "❄️", kosten: [50, 65, 105, 290], reich: [74, 80, 88, 96], schaden: [15, 24, 35, 49], rate: 2.1, typ: "puls", bremse: [0.6, 0.5, 0.4, 0.38], bremsT: 2, ziele: [4, 6, 8, 9], farbe: "#9fd6ec" },
    blitz:  { ab: 9,  sym: "⚡", kosten: [70, 85, 130, 330], reich: [104, 114, 124, 134], schaden: [44, 62, 88, 123], rate: 2.3, typ: "kette", ziele: [2, 3, 4, 4], farbe: "#f3e27a" },
    pilz:   { ab: 15, sym: "🍄", kosten: [45, 65, 105, 290], reich: [64, 70, 78, 84], schaden: [10, 16, 24, 34], rate: 1.8, typ: "gift", ziele: [2, 3, 4, 5], farbe: "#c49ae0" }
  };
  const TURM_MAX = 3; // Stufe 4 („Uralt“) ist der Index 3
  const WACHTER_REIHE = ["dorn", "wurzel", "wolf", "eis", "blitz", "pilz"];

  /* Tiergefährten: eigene Fähigkeiten, je Art höchstens eins (mit Talent zwei). pfad = steht am Weg */
  const TIERE = {
    baer:   { ab: 1,  sym: "🐻", kosten: [90, 110],  farbe: "#a8783e", pfad: true },
    eule:   { ab: 3,  sym: "🦉", kosten: [70, 90],   farbe: "#c9a35a", reich: [100, 120] },
    hirsch: { ab: 6,  sym: "🦌", kosten: [90, 110],  farbe: "#d8a868", reich: [90, 105] },
    keiler: { ab: 9,  sym: "🐗", kosten: [100, 120], farbe: "#8a6440", pfad: true },
    falke:  { ab: 12, sym: "🦅", kosten: [110, 130], farbe: "#9fb6c8" },
    dachs:  { ab: 15, sym: "🦡", kosten: [80, 100],  farbe: "#c8c0b0", pfad: true }
  };
  const TIERE_REIHE = ["baer", "eule", "hirsch", "keiler", "falke", "dachs"];
  /* Dauerhafte Talente im Druidenkreis (gelten über alle Raubzüge) */
  const TALENTE = {
    boden: { sym: "🌱", kosten: [3, 6, 10] }, saatgut: { sym: "💸", kosten: [4, 8, 12] }, tierfreund: { sym: "🐾", kosten: [15] },
    wildnis: { sym: "🐺", kosten: [5, 9, 14] }, mondsegen: { sym: "🌙", kosten: [4, 8, 12] }, zaeh: { sym: "❤️", kosten: [10, 20] }, raubzug: { sym: "🌿", kosten: [6, 12] }
  };

  /* Echos Zauberbuch für die Abwehr. ab = ab welchem Level, cd = Abklingzeit in Sekunden */
  const ZAUBER = {
    feuerball:  { ab: 0,  sym: "☄️", cd: 9,  farbe: "#ff8a3a" },
    eissturm:   { ab: 5,  sym: "❄️", cd: 15, farbe: "#9fd6ec" },
    mondstrahl: { ab: 8,  sym: "🌙", cd: 17, farbe: "#e8e4ff" },
    adler:      { ab: 11, sym: "🦅", cd: 15, farbe: "#c9a35a" },
    erdbeben:   { ab: 17, sym: "⛰️", cd: 24, farbe: "#c98a5a" }
  };
  const ZAUBER_REIHE = ["feuerball", "eissturm", "mondstrahl", "adler", "erdbeben"];

  /* ===== Wetter je Level: immer ein Vorteil und ein Nachteil =====
     m: Faktoren für mod(). Zahl = gilt für alles, Objekt = je Wächter (dorn, wurzel, wolf, eis, blitz, pilz) oder "alle". */
  const LAUNEN = {
    nebel:      { sym: "🌫️", m: { reich: { alle: 0.85 }, feindTempo: 0.85 } },
    gewitter:   { sym: "⛈️", ab: WACHTER.blitz.ab, m: { schaden: { blitz: 1.5 }, feindHp: 1.12 }, blitzschlag: true },
    vollmond:   { sym: "🌕", ab: 1, m: { tier: 1.5, zauberCd: 1.3 } },
    frost:      { sym: "❄️", ab: WACHTER.eis.ab, m: { schaden: { eis: 1.35 }, bremsT: 1.5, rate: { dorn: 0.8, wolf: 0.85 } } },
    duerre:     { sym: "☀️", ab: WACHTER.pilz.ab, m: { schaden: { pilz: 1.5 }, reich: { wurzel: 0.75 } } },
    regen:      { sym: "🌧️", m: { reich: { wurzel: 1.3 }, schaden: { wurzel: 1.2 }, zauberSchaden: 0.7 } },
    goldrausch: { sym: "💰", m: { anzahl: 1.35, saat: 1.5, punkte: 1.3 } },
    sturm:      { sym: "🌪️", m: { flugTempo: 0.65, rate: { alle: 0.88 } } },
    nacht:      { sym: "🌑", ab: 3, m: { elite: 2, saat: 1.25 } }
  };
  const LAUNEN_REIHE = Object.keys(LAUNEN);
  const launenFuer = lv => LAUNEN_REIHE.filter(k => (LAUNEN[k].ab || 0) <= lv);
  /* ===== Kleinode: Beute nach jedem Boss, eins aus drei, gilt bis zum Ende des Raubzugs ===== */
  const KLEINODE = {
    giftdorn:   { sym: "🐍", m: {} },
    rudel:      { sym: "🐺", m: { schaden: { wolf: 1.5 } } },
    frostherz:  { sym: "💎", m: { bremsT: 1.5, schaden: { eis: 1.2 } } },
    donnerhall: { sym: "⚡", m: {} },
    pilzring:   { sym: "🍄", m: { schaden: { pilz: 1.3 } } },
    wurzelherz: { sym: "🌳", m: { reich: { wurzel: 1.25 } } },
    falkenauge: { sym: "👁️", m: { reich: { alle: 1.1 } } },
    zunder:     { sym: "🔥", m: { zauberCd: 0.8, zauberSchaden: 1.25 } },
    wildherz:   { sym: "🐾", m: { tier: 1.35 } },
    saatbeutel: { sym: "🌰", m: { saat: 1.25 } },
    sparstrumpf:{ sym: "🧦", m: { zins: 1.75 } },
    schatzwacht:{ sym: "🗝️", m: {} },
    kleeblatt:  { sym: "🍀", m: { eliteBeute: 2 } },
    uraltrinde: { sym: "🪵", m: { uraltPreis: 0.75 } }
  };
  const KLEINODE_REIHE = Object.keys(KLEINODE);
  /* ===== Elite-Plünderer: selten, zäher, bringen mehr Beute ===== */
  const ELITE = {
    panzer:  { sym: "🛡️", farbe: "#d8cfb8", hp: 2.4 },
    flink:   { sym: "💨", farbe: "#9fd6ec", hp: 1.5, v: 1.45 },
    teilung: { sym: "✂️", farbe: "#c49ae0", hp: 1.6 },
    heilung: { sym: "✚", farbe: "#8ac24a", hp: 1.6 },
    schild:  { sym: "🔰", farbe: "#e0a046", hp: 1.4, schild: 0.7 }
  };
  const ELITE_REIHE = Object.keys(ELITE);
  /* Vorteile und Nachteile aus Wetter und Kleinoden zusammenrechnen */
  function mod(art, k) {
    if (!S) return 1;
    let m = 1;
    const nimm = q => { const v = q && q[art]; if (v == null) return; m *= typeof v === "number" ? v : (v[k] != null ? v[k] : v.alle != null ? v.alle : 1); };
    if (S.laune && LAUNEN[S.laune.k]) nimm(LAUNEN[S.laune.k].m);
    (S.kleinode || []).forEach(id => { if (KLEINODE[id]) nimm(KLEINODE[id].m); });
    return m;
  }
  const hat = id => !!(S && S.kleinode && S.kleinode.includes(id));
  const launeVon = () => (S && S.laune && LAUNEN[S.laune.k]) ? S.laune.k : null;
  /* Zinsen: Echo ist ein Sparfuchs */
  const zinsen = saat => Math.max(0, Math.floor(Math.min(saat * 0.08, 8 + 2 * Math.min(S.lv, KAMPAGNE + 6)) * mod("zins")));
  const ersparnis = saat => Math.max(0, Math.floor(Math.min(saat * 0.25, 40 + 8 * Math.min(S.lv, KAMPAGNE + 6)) * mod("zins")));

  /* Wildgestalten. ab = ab welchem Level verfügbar */
  const FORMEN = {
    ranke: { ab: 0,  sym: "🌿", schuss: 1, zug: 1, reich: 1 },
    rabe:  { ab: 0,  sym: "🐦", schuss: 1.9, zug: 1.6, reich: 1.2, maxGewicht: 2 },
    baer:  { ab: 1,  sym: "🐻", schuss: 0.78, zug: 2.3, reich: 0.95, fels: true },
    ratte: { ab: 15, sym: "🐀", schuss: 1.1, zug: 0.9, reich: 1.05, netz: true }
  };
  const FORMEN_REIHE = ["ranke", "rabe", "baer", "ratte"];

  /* Verbesserungen im Hain: Kosten pro Stufe */
  const UPS = {
    ranke:       { gruppe: "raub",  sym: "🌱", kosten: [80, 180, 310] },
    zug:         { gruppe: "raub",  sym: "💪", kosten: [70, 150, 270, 420] },
    zeit:        { gruppe: "raub",  sym: "🌙", kosten: [110, 240, 390] },
    wild:        { gruppe: "raub",  sym: "🦌", kosten: [130, 270, 450] },
    dauer:       { gruppe: "raub",  sym: "🐾", kosten: [180, 390] },
    goldnase:    { gruppe: "raub",  sym: "👃", kosten: [140, 290, 480] },
    rabenauge:   { gruppe: "raub",  sym: "👁️", kosten: [220] },
    grummeln:    { gruppe: "wesen", sym: "😤", kosten: [100, 210, 360] },
    wildherz:    { gruppe: "wesen", sym: "🔥", kosten: [200, 410] },
    heilkraut:   { gruppe: "wesen", sym: "❤️", kosten: [360, 530, 730, 980] },
    feuer:       { gruppe: "abwehr", sym: "☄️", kosten: [130, 270, 430] },
    funken:      { gruppe: "abwehr", sym: "✨", kosten: [110, 240, 410] },
    ernte:       { gruppe: "abwehr", sym: "🌾", kosten: [100, 210, 360] },
    notgroschen: { gruppe: "abwehr", sym: "💰", kosten: [80, 180, 320] },
    baerenkraft: { gruppe: "abwehr", sym: "🐻", kosten: [180, 380] },
    doppelgriff: { gruppe: "besonders", sym: "🤲", kosten: [420] },
    sanft:       { gruppe: "besonders", sym: "🧸", kosten: [320] },
    freunde:     { gruppe: "besonders", sym: "🐕", kosten: [200, 400] }
  };
  const MAX_LEBEN = 6;

  /* Dinge im Raubzug */
  const DINGE = {
    muenze:    { gewicht: 1,   r: 9,  wert: [14, 24] },
    beutel:    { gewicht: 2,   r: 12, wert: [38, 58] },
    nugget:    { gewicht: 3.6, r: 19, wert: [90, 130] },
    edelstein: { gewicht: 1,   r: 8,  wert: [65, 105] },
    stein:     { gewicht: 4,   r: 17, wert: [2, 2] },
    truhe:     { gewicht: 3,   r: 15, wert: [0, 0] },
    res:       { gewicht: 1,   r: 10, wert: [0, 0] },
    relikt:    { gewicht: 3,   r: 15, wert: [170, 250] }
  };

  /* ---------- Hilfen rund ums Level ---------- */
  const gebietVon = lv => lv < KAMPAGNE ? Math.floor(lv / LEVEL_PRO_GEBIET) : (lv - KAMPAGNE) % GEBIETE_ANZAHL;
  const innenVon = lv => lv < KAMPAGNE ? lv % LEVEL_PRO_GEBIET : (lv - KAMPAGNE) % LEVEL_PRO_GEBIET;
  const istBossLevel = lv => lv < KAMPAGNE ? innenVon(lv) === 2 : (lv - KAMPAGNE) % 4 === 3;
  const endlosRunde = lv => lv - KAMPAGNE + 1;
  /* Gegner werden mit jedem Level zäher – ohne Obergrenze, damit der Garten immer weiter wachsen muss */
  const skalierung = lv => (1 + 0.35 * lv + 0.1 * lv * lv) * (lv > KAMPAGNE ? Math.pow(1.15, lv - KAMPAGNE) : 1);
  const tal = k => (STAT.talente && STAT.talente[k]) || 0;
  function neueFreischaltungen(lv) {
    const n = [];
    FORMEN_REIHE.forEach(k => { if (FORMEN[k].ab === lv && lv > 0) n.push(FORMEN[k].sym + " " + t().formen[k][0]); });
    WACHTER_REIHE.forEach(k => { if (WACHTER[k].ab === lv && lv > 0) n.push(WACHTER[k].sym + " " + t().wachter[k][0]); });
    ZAUBER_REIHE.forEach(k => { if (ZAUBER[k].ab === lv && lv > 0) n.push(ZAUBER[k].sym + " " + t().zauber[k][0]); });
    return n;
  }

  /* ---------- Einstellungen: Lautstärke von Effekten und Musik, Vibration ---------- */
  const EINST = (() => {
    const d = { effekte: lies("imres-echohort-ton", "1") === "0" ? 0 : 0.8, musik: 0.5, vib: true };
    const std = Object.assign({}, d);
    try { const v = JSON.parse(localStorage.getItem("imres-echohort-einst") || "null"); if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(d, v); } catch (_) {}
    /* Kaputte oder fremde Werte (z. B. "laut") würden die Lautstärke-Regler und AudioParams sprengen */
    ["effekte", "musik"].forEach(k => { const n = Number(d[k]); d[k] = typeof d[k] !== "boolean" && d[k] !== null && d[k] !== "" && isFinite(n) ? Math.min(1, Math.max(0, n)) : std[k]; });
    d.vib = typeof d.vib === "boolean" ? d.vib : std.vib;
    Object.keys(d).forEach(k => { if (!(k in std)) delete d[k]; });
    return d;
  })();
  const einstSichern = () => schreib("imres-echohort-einst", JSON.stringify(EINST));

  /* ---------- Klang: Effekte selbst berechnet, Musik aus den echten Instrumenten des Lautenwerks ---------- */
  let ac = null, rauschen = null, effektBus = null, musikBus = null;
  function busseSetzen() {
    if (!ac) return;
    effektBus.gain.setTargetAtTime(EINST.effekte, ac.currentTime, 0.05);
    musikBus.gain.setTargetAtTime(EINST.musik * 0.9, ac.currentTime, 0.05);
  }
  function audio() {
    if (EINST.effekte <= 0 && EINST.musik <= 0) return null;
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; }
      effektBus = ac.createGain(); effektBus.connect(ac.destination);
      musikBus = ac.createGain(); musikBus.connect(ac.destination);
      effektBus.gain.value = EINST.effekte; musikBus.gain.value = EINST.musik * 0.9;
    }
    if (ac.state === "suspended") ac.resume();
    if (!rauschen) {
      rauschen = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
      const d = rauschen.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
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
    if (EINST.effekte <= 0) return;
    let ziel = huelle(a, effektBus, t0, laut, dauer);
    if (filt) { const b = a.createBiquadFilter(); b.type = filt[0]; b.frequency.value = filt[1]; b.Q.value = filt[2] || 1; b.connect(ziel); ziel = b; }
    o.connect(ziel); o.start(t0); o.stop(t0 + dauer + 0.05);
  }
  function knistern(dauer, laut, typ, freq, verz) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const q = a.createBufferSource(); q.buffer = rauschen;
    const b = a.createBiquadFilter(); b.type = typ; b.frequency.value = freq;
    if (EINST.effekte <= 0) { return; }
    q.connect(b); b.connect(huelle(a, effektBus, t0, laut, dauer));
    q.start(t0, Math.random() * 0.5); q.stop(t0 + dauer + 0.05);
  }
  /* ---------- Musik: viele Stücke je Gebiet, mit Teilen, Wiederholungen und Pausen ----------
     Jedes Stück wird beim Start aus der Palette des Gebiets zusammengesetzt: Tonart, Modus, Tempo,
     gerader Takt oder Walzer, Akkordfolgen und Instrumente je Teil sowie eigene Melodie-Motive.
     Form z. B. Intro – A – A – B – A – C – B – A – Outro; danach eine kurze Pause und ein neues Stück.
     Die Lage des Spiels (Raubzug, Baupause, Welle, Boss) bestimmt, wie voll und treibend es klingt. */
  const MODI = { ionisch: [0, 2, 4, 5, 7, 9, 11], dorisch: [0, 2, 3, 5, 7, 9, 10], phrygisch: [0, 1, 3, 5, 7, 8, 10], lydisch: [0, 2, 4, 6, 7, 9, 11],
    mixo: [0, 2, 4, 5, 7, 9, 10], aeolisch: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], phrdom: [0, 1, 4, 5, 7, 8, 10], lokrisch: [0, 1, 3, 5, 6, 8, 10] };
  const FOLGEN = {
    dur: [[0, 4, 5, 3], [0, 3, 4, 0], [0, 5, 3, 4], [0, 3, 0, 4], [3, 4, 0, 0], [0, 1, 3, 4], [0, 6, 3, 0], [0, 2, 3, 4]],
    moll: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 6, 5, 6], [0, 5, 6, 0], [0, 3, 6, 2], [5, 3, 0, 4], [0, 4, 5, 4], [0, 6, 3, 4]],
    duster: [[0, 1, 0, 6], [0, 1, 5, 0], [0, 5, 1, 0], [0, 0, 1, 1], [0, 6, 5, 1], [0, 3, 1, 0]]
  };
  const MUSTER = {
    gerade: [[0, 1, 2, 1, 0, 1, 2, 1], [0, 2, 1, 2, 0, 2, 1, 2], [0, 1, 2, 3, 2, 1, 2, 1], [0, -1, 2, -1, 1, -1, 2, -1], [0, 2, 3, 2, 1, 2, 3, 2], [0, -1, -1, 1, 2, -1, 1, -1], [0, 1, 0, 2, 0, 1, 0, 3]],
    walzer: [[0, 1, 2, 3, 2, 1], [0, -1, 1, 2, 1, 2], [0, 2, 1, 2, 3, 2], [0, -1, 2, -1, 1, -1]]
  };
  const RHYTHMEN = { gerade: [[2, 2, 4], [1, 1, 2, 4], [3, 1, 2, 2], [2, 1, 1, 4], [4, 2, 2], [2, 2, 2, 2], [1, 1, 1, 1, 4], [6, 2], [8]], walzer: [[2, 2, 2], [3, 3], [2, 1, 3], [4, 2], [6]] };
  const GEBIET_MUSIK = {
    wald:        { grund: [50, 52, 55], modi: ["dorisch", "aeolisch", "mixo"], tempo: [74, 98], walzer: 0.3, arp: ["gitarre", "harfe"], mel: ["fl", "oka", "pan", "geige", "stimme"], bass: ["vc", "kb"], pad: ["vc", "geigest"], schlag: ["bodh", "schelle"], natur: "k_voegel" },
    dorf:        { grund: [55, 57, 53], modi: ["mixo", "ionisch", "dorisch"], tempo: [96, 124], walzer: 0.45, arp: ["gitarre"], mel: ["dudel", "fl", "geige", "klar"], bass: ["kb", "vc"], pad: ["oboest", "geigest"], schlag: ["bodh", "tamb", "holz"], natur: "k_feuer" },
    turm:        { grund: [57, 55], modi: ["aeolisch", "phrygisch", "dorisch"], tempo: [64, 84], walzer: 0.2, arp: ["harfe", "spic"], mel: ["fl", "horn", "oboe", "geige"], bass: ["vctrem", "kb"], pad: ["vlntrem", "vc"], schlag: ["timp", "holz"], natur: "k_wind" },
    schmiede:    { grund: [50, 48], modi: ["aeolisch", "harm", "dorisch"], tempo: [72, 92], walzer: 0.15, arp: ["gitarre", "spic"], mel: ["horn", "fag", "klar"], bass: ["tuba", "vc"], pad: ["orgel", "vc"], schlag: ["amboss", "bodh"], natur: "k_feuer" },
    donnerbaum:  { grund: [52, 53], modi: ["phrygisch", "aeolisch", "lokrisch"], tempo: [58, 76], walzer: 0.25, arp: ["harfe", "spic"], mel: ["oka", "stimme", "oboe"], bass: ["vctrem", "kb"], pad: ["vlntrem"], schlag: ["holz", "timp"], natur: "k_grillen" },
    unterreich:  { grund: [48, 46], modi: ["lokrisch", "phrygisch", "harm"], tempo: [52, 68], walzer: 0.2, arp: ["harfe"], mel: ["glock", "stimme", "fl"], bass: ["vctrem", "kb"], pad: ["orgel", "vlntrem"], schlag: ["gong", "timp"], natur: "k_bach", luecken: 0.4 },
    see:         { grund: [53, 55, 50], modi: ["lydisch", "ionisch", "dorisch"], tempo: [60, 82], walzer: 0.4, arp: ["harfe", "gitarre"], mel: ["pan", "fl", "stimme", "klar"], bass: ["vc", "kb"], pad: ["geigest", "flst"], schlag: ["shake", "schelle"], natur: "k_wellen" },
    gracklstugh: { grund: [50, 49], modi: ["harm", "phrdom", "aeolisch"], tempo: [76, 96], walzer: 0.1, arp: ["gitarre", "spic"], mel: ["horn", "trp", "pos", "fag"], bass: ["tuba", "kb"], pad: ["orgel"], schlag: ["amboss", "timp", "bodh"], natur: "k_feuer" },
    hort:        { grund: [50, 47, 52], modi: ["harm", "phrdom", "dorisch", "lydisch"], tempo: [66, 88], walzer: 0.15, arp: ["harfe", "gitarre"], mel: ["horn", "glock", "oboe", "trp"], bass: ["tuba", "kb"], pad: ["orgel", "vctrem"], schlag: ["timp", "gong", "amboss"], natur: "k_feuer" }
  };
  const PROBEN = {
    gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 95, 98, 101],
    fl: [60, 64, 69, 72, 76, 81, 84, 88, 93, 96], flst: [69, 72, 76, 81, 84, 88, 93, 96], vc: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77], vctrem: [36, 40, 43, 50, 53, 57, 59, 60, 64, 67, 71, 74, 77],
    dudel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87], oka: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90], pan: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90],
    glock: [79, 84, 91, 96, 103, 108], horn: [36, 39, 43, 46, 50, 53, 57, 60], tuba: [34, 39, 41, 46, 50, 53, 58], stimme: [57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87],
    geige: [55, 57, 60, 64, 67, 69, 72, 76, 79, 81, 84, 88, 91, 93, 96], geigest: [55, 57, 60, 64, 67, 69, 72, 76, 79, 81, 84, 88, 91, 93, 96],
    kb: [28, 30, 31, 34, 36, 38, 40, 42, 44, 45, 49, 52, 56, 59], spic: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77],
    klar: [50, 53, 58, 62, 65, 70, 74, 77, 82, 86, 90], oboe: [58, 62, 65, 70, 74, 77, 82, 86, 89], oboest: [58, 62, 65, 70, 74, 77, 82, 89],
    fag: [34, 37, 41, 45, 46, 48, 55, 60, 63, 68, 69, 72], pos: [34, 37, 39, 41, 46, 50, 53, 60, 61, 63, 65], trp: [53, 57, 60, 63, 67, 70, 74, 77, 81, 84],
    orgel: [36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96], vlntrem: [55, 57, 59, 62, 69, 72, 76, 79, 83, 86]
  };
  const PEGEL = { gitarre: 0.5, harfe: 0.45, fl: 0.26, flst: 0.2, vc: 0.32, vctrem: 0.24, dudel: 0.15, oka: 0.26, pan: 0.26, glock: 0.15, horn: 0.26, tuba: 0.3, stimme: 0.2,
    geige: 0.22, geigest: 0.16, kb: 0.4, spic: 0.42, klar: 0.24, oboe: 0.2, oboest: 0.15, fag: 0.28, pos: 0.24, trp: 0.2, orgel: 0.13, vlntrem: 0.14,
    amboss: 0.28, bodh1: 0.45, bodh2: 0.38, gong: 0.32, timp1: 0.42, timp3: 0.38, timp5: 0.36, timproll: 0.35, bd: 0.4, crash: 0.22, snare1: 0.22, snare2: 0.18,
    schelle1: 0.2, schelle2: 0.16, tamb1: 0.2, tamb2: 0.16, holz1: 0.3, holz2: 0.26, shake: 0.18, natur: 0.12 };
  /* Lagen für die Melodie: wohin welches Instrument gehört */
  const LAGE = { fl: 12, flst: 12, oka: 12, pan: 12, glock: 24, stimme: 12, geige: 12, klar: 0, oboe: 12, horn: -12, fag: -12, pos: -12, trp: 0, dudel: 12, gitarre: 0, harfe: 12 };
  const probeBasis = (() => { const sk = document.querySelector('script[src*="echohort"]'); return sk ? sk.src.replace(/echohort\.js.*$/, "klang/") : "klang/"; })();
  const probePuffer = new Map(), probeLaedt = new Map();
  function probeLaden(name) {
    if (probePuffer.has(name) || probeLaedt.has(name) || !ac) return;
    const c = ac;
    probeLaedt.set(name, fetch(probeBasis + name + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(b => new Promise((ok, f) => { const x = c.decodeAudioData(b, ok, f); if (x && x.catch) x.catch(f); }))
      .then(b => { const d = b.getChannelData(0); let m = 0, i = 0; for (let k = 0; k < d.length; k++) m = Math.max(m, Math.abs(d[k])); while (i < d.length && Math.abs(d[i]) < m * 0.02) i++; b._start = Math.max(0, i / b.sampleRate - 0.003); probePuffer.set(name, b); })
      .catch(() => { probeLaedt.delete(name); }));
  }
  const naechste = (fam, midi) => PROBEN[fam].reduce((b, m) => Math.abs(m - midi) < Math.abs(b - midi) ? m : b, PROBEN[fam][0]);
  function note(fam, midi, zeit, dauer, laut) {
    if (!ac || EINST.musik <= 0) return;
    const m = PROBEN[fam] ? naechste(fam, midi) : null, name = m == null ? fam : fam + "_" + m, b = probePuffer.get(name);
    if (!b) { probeLaden(name); return; }
    const q = ac.createBufferSource(), g = ac.createGain();
    q.buffer = b; if (m != null) q.playbackRate.value = Math.pow(2, (midi - m) / 12);
    const l = Math.min((b.duration - b._start) / q.playbackRate.value, dauer), v = (PEGEL[fam] || 0.3) * (laut || 1) * (MZ.pegel || 1);
    g.gain.setValueAtTime(0, zeit); g.gain.linearRampToValueAtTime(v, zeit + 0.012);
    g.gain.setValueAtTime(v, Math.max(zeit + 0.012, zeit + l - 0.25)); g.gain.linearRampToValueAtTime(0, zeit + l);
    q.connect(g); g.connect(musikBus); q.start(zeit, b._start); q.stop(zeit + l + 0.05);
  }
  function famVorladen(fam, a, b) { if (PROBEN[fam]) PROBEN[fam].filter(m => m >= a - 5 && m <= b + 5).forEach(m => probeLaden(fam + "_" + m)); else probeLaden(fam); }
  const MZ = { an: false, k: "", lage: 0, st: null, teil: 0, takt: 0, pos: 0, naechste: 0, timer: 0, pause: 0, pegel: 1, bossStueck: false, natur: null, naturGain: null };

  function motivBauen(walzer) {
    const noten = []; let pos = 0, stufe = zufall([0, 2, 4, 7]);
    const takt = walzer ? 6 : 8;
    for (let tk = 0; tk < 2; tk++) {
      const rh = zufall(walzer ? RHYTHMEN.walzer : RHYTHMEN.gerade);
      rh.forEach(d => { noten.push({ pos: pos, dauer: d, stufe, pause: Math.random() < 0.12 }); pos += d; stufe = klemm(stufe + zufall([-2, -1, -1, 1, 1, 2, 0, 3, -3]), -1, 9); });
      pos = (tk + 1) * takt;
    }
    return noten;
  }
  function stueckBauen(k, boss) {
    const G = GEBIET_MUSIK[k] || GEBIET_MUSIK.wald;
    const modus = boss ? zufall(["harm", "phrygisch", "phrdom"]) : zufall(G.modi);
    const art = ["ionisch", "lydisch", "mixo"].includes(modus) ? "dur" : ["phrygisch", "lokrisch", "phrdom"].includes(modus) ? "duster" : "moll";
    const walzer = !boss && Math.random() < G.walzer;
    const teil = energie => ({
      folge: zufall(FOLGEN[art]).slice(), muster: zufall(walzer ? MUSTER.walzer : MUSTER.gerade), motiv: motivBauen(walzer), energie,
      arp: zufall(G.arp), mel: boss ? zufall(["horn", "trp", "pos"]) : zufall(G.mel), bass: zufall(G.bass), pad: zufall(G.pad)
    });
    const teile = { A: teil(1), B: teil(2), C: teil(0) };
    if (Math.random() < 0.5) teile.B.arp = teile.A.arp;
    const formen = boss ? [["I", "A", "B", "A", "B", "C", "B", "B"]] :
      [["I", "A", "A", "B", "A", "C", "B", "A", "O"], ["I", "A", "B", "A", "B", "C", "A", "O"], ["I", "A", "A", "B", "B", "A", "O"], ["A", "B", "C", "A", "B", "O"], ["I", "A", "C", "A", "B", "B", "O"]];
    const st = {
      k, boss, modus, leiter: MODI[modus], grund: zufall(G.grund) + (boss ? -2 : 0) + zufall([0, 0, 2, -2]),
      walzer, achtel: walzer ? 6 : 8, tempo: zw(G.tempo[0], G.tempo[1]) * (boss ? 1.15 : 1),
      teile, form: zufall(formen).slice(), schlag: boss ? "timp" : zufall(G.schlag), luecken: G.luecken || 0, natur: G.natur
    };
    // Instrumente rechtzeitig laden
    Object.values(teile).forEach(T => { famVorladen(T.arp, st.grund, st.grund + 26); famVorladen(T.mel, st.grund + (LAGE[T.mel] || 0) - 2, st.grund + (LAGE[T.mel] || 0) + 22); famVorladen(T.bass, st.grund - 26, st.grund - 4); famVorladen(T.pad, st.grund, st.grund + 16); });
    ["bodh1", "bodh2", "schelle1", "schelle2", "tamb1", "tamb2", "holz1", "holz2", "shake", "timp1", "timp3", "timproll", "crash", "bd", "snare1", "snare2", "gong", "amboss", st.natur].forEach(n => n && probeLaden(n));
    return st;
  }
  const teilLaenge = (st, t) => t === "I" ? 2 : t === "O" ? 2 : t === "C" ? 4 : 8;
  function naturStarten(name) {
    if (!ac || MZ.natur === name) return;
    naturStoppen();
    const b = probePuffer.get(name); if (!b) { probeLaden(name); setTimeout(() => { if (MZ.an && !MZ.natur) naturStarten(name); }, 1500); return; }
    const q = ac.createBufferSource(), g = ac.createGain();
    q.buffer = b; q.loop = true; g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(PEGEL.natur, ac.currentTime + 3);
    q.connect(g); g.connect(musikBus); q.start();
    MZ.natur = name; MZ.naturQ = q; MZ.naturGain = g;
  }
  function naturStoppen() {
    if (!MZ.naturQ || !ac) { MZ.natur = null; return; }
    const q = MZ.naturQ; MZ.naturGain.gain.setTargetAtTime(0, ac.currentTime, 0.4); setTimeout(() => { try { q.stop(); } catch (_) {} }, 2000);
    MZ.natur = null; MZ.naturQ = null;
  }
  function neuesStueck(boss) {
    MZ.st = stueckBauen(MZ.k, boss); MZ.bossStueck = !!boss;
    MZ.teil = 0; MZ.takt = 0; MZ.pos = 0;
  }
  function musikStart(k, lage) {
    /* Musik aus: nichts laden und keinen Takt laufen lassen – nur merken, wo wir sind, damit späteres Aufdrehen passt */
    if (EINST.musik <= 0) { if (GEBIET_MUSIK[k]) { if (MZ.k !== k) MZ.st = null; MZ.k = k; MZ.lage = lage || 0; } return; }
    if (!audio() || !GEBIET_MUSIK[k]) return;
    const neuesGebiet = MZ.k !== k;
    MZ.k = k; MZ.lage = lage || 0;
    if (neuesGebiet || !MZ.st || (MZ.bossStueck && MZ.lage < 3)) { neuesStueck(false); MZ.pause = 0; }
    naturStarten(GEBIET_MUSIK[k].natur);
    if (MZ.an) return;
    MZ.an = true; MZ.naechste = ac.currentTime + 0.15;
    MZ.timer = setInterval(musikTakt, 90);
  }
  /* Wechsel bei neuem Spielabschnitt: das laufende Stück klingt mit dem Outro aus, dann kommt ein neues */
  function musikWechsel(lage) {
    MZ.lage = lage;
    if (!MZ.st || MZ.teil === 0) return;
    const rest = MZ.st.form.slice(MZ.teil + 1);
    if (rest.length > 1) MZ.st.form = MZ.st.form.slice(0, MZ.teil + 1).concat(["O"]);
  }
  function musikLage(n) {
    if (MZ.lage === n) return;
    const vorher = MZ.lage; MZ.lage = n;
    if (!MZ.an || !ac) return;
    if (n === 3 && !MZ.bossStueck) { neuesStueck(true); MZ.pause = 0; note("timproll", 0, ac.currentTime + 0.05, 2.5, 1); note("gong", 0, ac.currentTime + 1.2, 4, 0.8); }
    else if (vorher === 3 && n < 3 && MZ.bossStueck) { neuesStueck(false); MZ.pause = 2; }
  }
  function musikSignal(art) {
    if (!MZ.an || !ac || EINST.musik <= 0 || !MZ.st) return;
    const z = ac.currentTime + 0.05, g = MZ.st.grund, L = MZ.st.leiter;
    if (art === "welle") { note("horn", g - 12, z, 0.5, 1.2); note("horn", g - 12 + L[4], z + 0.32, 0.9, 1.3); note("bodh1", 0, z, 1, 1); }
    else if (art === "geschafft") [0, 2, 4, 7].forEach((s, i) => note("harfe", g + 12 + L[s % 7] + (s >= 7 ? 12 : 0), z + i * 0.09, 1.2, 0.9));
  }
  function musikStop() { if (!MZ.an) return; MZ.an = false; clearInterval(MZ.timer); naturStoppen(); }
  function tonDerStufe(st, stufe) { const n = st.leiter.length; return st.grund + st.leiter[((stufe % n) + n) % n] + 12 * Math.floor(stufe / n); }
  function musikTakt() {
    if (!ac || !MZ.an || EINST.musik <= 0 || !MZ.st) return;
    while (MZ.naechste < ac.currentTime + 0.4) {
      const st = MZ.st, lage = MZ.lage, tempo = st.tempo * (lage >= 2 ? 1.08 : 1), achtel = 60 / tempo / 2, z = MZ.naechste;
      if (MZ.pause > 0) { // Atempause zwischen zwei Stücken: nur die Natur
        MZ.pos++; if (MZ.pos >= st.achtel) { MZ.pos = 0; MZ.pause--; }
        MZ.naechste += achtel; continue;
      }
      const tName = st.form[MZ.teil], T = tName === "I" || tName === "O" ? st.teile.A : st.teile[tName], pos = MZ.pos, takt = MZ.takt;
      const akk = T.folge[takt % T.folge.length], akkord = [0, 2, 4].map(s => tonDerStufe(st, akk + s));
      // Fülle: Abschnitt des Stücks und Lage des Spiels
      const energie = tName === "I" ? 0 : tName === "O" ? 0 : T.energie;
      const voll = energie + (lage >= 2 ? 1 : 0) + (lage === 3 ? 1 : 0);
      MZ.pegel = tName === "O" ? 1 - (takt * st.achtel + pos) / (2 * st.achtel) * 0.6 : tName === "I" ? 0.7 + (takt * st.achtel + pos) / (2 * st.achtel) * 0.3 : 1;
      const takte = st.achtel;
      // Bass
      if (pos === 0) note(T.bass, akkord[0] - 12, z, achtel * takte, energie === 0 ? 0.8 : 1);
      else if (voll >= 2 && pos === takte / 2 && !st.walzer) note(T.bass, akkord[voll >= 3 ? 2 : 0] - 12, z, achtel * 3, 0.7);
      // Klangteppich in ruhigen Teilen und bei voller Besetzung
      if (pos === 0 && (energie === 0 || voll >= 3 || tName === "B")) { note(T.pad, akkord[1], z, achtel * takte * 1.05, 0.7); if (voll >= 3) note(T.pad, akkord[2] + 12, z, achtel * takte, 0.5); }
      // Arpeggio
      if (tName !== "I" && (energie >= 1 || lage >= 1 || takt % 2 === 0)) {
        const m = T.muster[pos % T.muster.length];
        if (m >= 0 && !(st.luecken && Math.random() < st.luecken) && !(energie === 0 && pos % 2)) note(T.arp, (m === 3 ? akkord[0] + 12 : akkord[m]) + 12, z, achtel * 3, pos === 0 ? 1 : 0.75);
      }
      // Melodie: Motiv über zwei Takte, folgt den Akkorden, am Phrasenende zum Grundton
      if (tName !== "I" && tName !== "O" && energie >= 1 || (tName === "C" && takt % 2 === 0)) {
        const imMotiv = (takt % 2) * takte + pos, phrasenEnde = takt === teilLaenge(st, tName) - 1;
        T.motiv.forEach(n => {
          if (n.pos !== imMotiv || n.pause) return;
          let stufe = akk + n.stufe;
          if (phrasenEnde && n === T.motiv[T.motiv.length - 1]) stufe = akk + 7;
          const varTon = takt >= 4 && tName !== "C" ? (n.stufe % 2 ? 1 : 0) : 0;
          note(T.mel, tonDerStufe(st, stufe + varTon) + (LAGE[T.mel] || 0), z, achtel * n.dauer * 1.1, tName === "C" ? 0.8 : 1);
        });
      }
      // Schlagwerk
      if (voll >= 2 || (voll >= 1 && st.schlag && takt % 2 === 1)) {
        const s = lage === 3 ? "timp" : st.schlag;
        if (s === "bodh" || lage >= 2) { if (pos === 0) note("bodh1", 0, z, 1, 1); else if (st.walzer ? pos === 3 : (pos === 3 || pos === 4 || pos === 6)) note("bodh2", 0, z, 1, 0.75); }
        if (s === "schelle" && pos % 2 === 1) note(pos % 4 === 1 ? "schelle1" : "schelle2", 0, z, 1, 0.8);
        if (s === "tamb" && pos % 2 === 1) note(pos === 3 ? "tamb1" : "tamb2", 0, z, 1, 0.8);
        if (s === "holz" && (pos === 2 || pos === 6)) note(pos === 2 ? "holz1" : "holz2", 0, z, 1, 0.8);
        if (s === "shake" && pos % 2 === 1) note("shake", 0, z, 1, 0.7);
        if (s === "amboss" && pos === 0 && takt % 2 === 0) note("amboss", 0, z, 1.5, 1);
        if (s === "gong" && pos === 0 && takt === 0) note("gong", 0, z, 4, 0.8);
        if (s === "timp" && (pos === 0 || (lage === 3 && pos === takte / 2))) note(takt % 2 ? "timp3" : "timp1", 0, z, 2, 1);
        if (lage === 3 && pos === 0 && takt % 2 === 0) note("bd", 0, z, 1.5, 1);
        if (lage >= 2 && voll >= 3 && pos % 2 === 1 && !st.walzer) note(pos === 7 ? "snare1" : "snare2", 0, z, 1, 0.6);
      }
      if (pos === 0 && takt === 0 && tName === "B" && lage >= 2) note("crash", 0, z, 3, 0.9);
      // weiter
      MZ.naechste += achtel; MZ.pos++;
      if (MZ.pos >= takte) {
        MZ.pos = 0; MZ.takt++;
        if (MZ.takt >= teilLaenge(st, tName)) {
          MZ.takt = 0; MZ.teil++;
          if (MZ.teil >= st.form.length) { MZ.pause = st.boss ? 0 : 1 + Math.floor(Math.random() * 3); neuesStueck(MZ.lage === 3); }
        }
      }
    }
  }

  let letzterKlang = {}, letzteVib = 0;
  function vib(ms) { if (!EINST.vib || !navigator.vibrate) return; const j = performance.now(); if (j - letzteVib < 90) return; letzteVib = j; try { navigator.vibrate(ms); } catch (_) {} }
  function selten(k, ms) { const j = performance.now(); if (letzterKlang[k] && j - letzterKlang[k] < ms) return false; letzterKlang[k] = j; return true; }
  const KLANG = {
    wurf: () => { knistern(0.18, 0.08, "bandpass", 1800); ton("triangle", 260, 520, 0.14, 0.05); },
    griff: () => { knistern(0.06, 0.18, "lowpass", 1200); },
    gold: () => [1046, 1318, 1568].forEach((f, i) => ton("sine", f, f, 0.16, 0.06, i * 0.05)),
    edel: () => [1318, 1760, 2093, 2637].forEach((f, i) => ton("sine", f, f, 0.2, 0.05, i * 0.05)),
    stein: () => { knistern(0.18, 0.25, "lowpass", 380); ton("sine", 120, 60, 0.18, 0.2); },
    grummeln: () => ton("sawtooth", 95, 70, 0.6, 0.1, 0, ["lowpass", 420, 1]),
    tier: () => ton("triangle", 900, 1500, 0.12, 0.06),
    kappen: () => { knistern(0.12, 0.2, "highpass", 2200); ton("square", 300, 120, 0.15, 0.05); },
    boom: () => { knistern(0.8, 0.32, "lowpass", 520); ton("sine", 110, 40, 0.7, 0.25); },
    blitz: () => { knistern(0.35, 0.25, "highpass", 1500); ton("sawtooth", 1400, 200, 0.25, 0.06); },
    bruellen: () => { knistern(1.0, 0.3, "lowpass", 320); ton("sawtooth", 80, 45, 1.0, 0.2, 0, ["lowpass", 450, 1]); },
    puff: () => knistern(0.25, 0.12, "bandpass", 900),
    bau: () => { [392, 523, 659].forEach((f, i) => ton("triangle", f, f, 0.14, 0.07, i * 0.06)); knistern(0.2, 0.06, "lowpass", 900); },
    dorn: () => { if (selten("dorn", 70)) knistern(0.05, 0.05, "highpass", 3000); },
    biss: () => { if (selten("biss", 90)) { knistern(0.08, 0.15, "bandpass", 700); ton("sawtooth", 220, 110, 0.1, 0.05); } },
    frost: () => { if (selten("frost", 120)) knistern(0.4, 0.08, "highpass", 4000); },
    wurzel: () => { if (selten("wurzel", 150)) ton("sine", 90, 70, 0.3, 0.1); },
    sporen: () => { if (selten("sporen", 150)) knistern(0.3, 0.05, "bandpass", 1200); },
    tod: () => { if (selten("tod", 60)) ton("triangle", 420, 140, 0.2, 0.06); },
    klau: () => { ton("square", 600, 300, 0.2, 0.05); [880, 660].forEach((f, i) => ton("sine", f, f, 0.12, 0.05, 0.05 + i * 0.07)); },
    boss: () => { ton("sawtooth", 70, 50, 1.4, 0.2, 0, ["lowpass", 300, 1]); knistern(1.4, 0.18, "lowpass", 250); },
    schrei: () => { ton("sawtooth", 300, 90, 1.2, 0.15, 0, ["bandpass", 600, 3]); knistern(1.2, 0.2, "bandpass", 900); },
    sieg: () => [523, 659, 784, 1046, 1318].forEach((f, i) => ton("triangle", f, f, 0.25, 0.1, i * 0.1)),
    verloren: () => [392, 330, 262, 196].forEach((f, i) => ton("triangle", f, f * 0.98, 0.35, 0.12, i * 0.22)),
    kaufen: () => [784, 1046].forEach((f, i) => ton("sine", f, f, 0.15, 0.08, i * 0.08)),
    bellen: () => { ton("sawtooth", 560, 280, 0.09, 0.13, 0, ["bandpass", 900, 2]); ton("sawtooth", 600, 300, 0.1, 0.13, 0.15, ["bandpass", 900, 2]); },
    laute: () => [392, 494, 587, 784, 587, 659, 784, 988].forEach((f, i) => ton("triangle", f, f * 0.995, 0.45, 0.06, i * 0.16)),
    schnitt: () => { knistern(0.12, 0.2, "highpass", 3500); ton("sawtooth", 1800, 400, 0.08, 0.04); },
    verwandeln: () => { knistern(0.3, 0.1, "bandpass", 600); ton("sine", 300, 900, 0.3, 0.06); }
  };

  /* ---------- Spielzustand ---------- */
  let zustand = "start"; // start | spiel | tafel | pause | ende
  let S = null;
  const SPEICHER = "imres-echohort-spiel";
  const up = k => (S && S.up[k]) || 0;
  const zornFaktor = () => STUFEN[S.stufe].zorn * (1 - 0.15 * up("grummeln"));

  /* ---------- Schatzkammer, Statistik und Trophäen (gelten für alle Schwierigkeiten) ---------- */
  const ERFOLGE = [["erster", "💰"], ["relikt1", "🏺"], ["relikt8", "👑"], ["beute1000", "🪙"], ["gier5", "🤑"], ["zorn3", "🌋"], ["kombo", "⚡"], ["rex", "🐕"], ["ezekiel", "🗡️"],
    ["sparsam", "🌱"], ["bosse", "☠️"], ["demo", "🐙"], ["kampagne", "🗺️"], ["endlos5", "♾️"], ["sterne", "⭐"], ["alleSterne", "🌟"], ["hain", "🌳"]];
  let STAT = (() => { try { const v = JSON.parse(localStorage.getItem("imres-echohort-statistik") || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch (_) { return {}; } })();
  ["relikte", "bosse", "erfolge", "talente"].forEach(k => { if (!STAT[k] || typeof STAT[k] !== "object" || Array.isArray(STAT[k])) STAT[k] = {}; });
  ["mond", "kombos", "rex", "ezekiel"].forEach(k => { if (k in STAT && !(typeof STAT[k] === "number" && isFinite(STAT[k]) && STAT[k] >= 0)) STAT[k] = 0; });
  ["relikte", "talente"].forEach(k => Object.keys(STAT[k]).forEach(i => { const n = STAT[k][i]; if (!(typeof n === "number" && isFinite(n) && n >= 0)) delete STAT[k][i]; }));
  const statSichern = () => schreib("imres-echohort-statistik", JSON.stringify(STAT));
  function erfolg(id) {
    if (STAT.erfolge[id]) return;
    STAT.erfolge[id] = new Date().toISOString().slice(0, 10); statSichern();
    const e = ERFOLGE.find(x => x[0] === id), tx = t();
    toast(e ? e[1] : "🏆", tx.trophaee + " " + tx.erfolge[id][0], tx.erfolge[id][1]);
  }
  function erfolgPruefen(id) {
    if (id === "kombo" && (STAT.kombos || 0) >= 50) erfolg("kombo");
    if (id === "rex" && (STAT.rex || 0) >= 5) erfolg("rex");
    if (id === "ezekiel" && (STAT.ezekiel || 0) >= 25) erfolg("ezekiel");
    if (id === "bosse") { const alle = GEB.map(G => G.boss).filter(b => !FEINDE[b].unbesiegbar); if (alle.every(b => STAT.bosse[b])) erfolg("bosse"); }
    if (id === "relikte") { const n = Object.keys(STAT.relikte).filter(g => STAT.relikte[g] > 0).length; if (n >= 1) erfolg("relikt1"); if (n >= GEBIETE_ANZAHL) erfolg("relikt8"); }
    if (id === "sterne") {
      Object.keys(STUFEN).forEach(st => { const al = sterneLesen(st), n = Object.keys(al).reduce((a, k) => a + (al[k] || 0), 0); if (n >= KAMPAGNE * 1.5) erfolg("sterne"); if (n >= KAMPAGNE * 3) erfolg("alleSterne"); });
    }
    if (id === "hain" && Object.keys(UPS).every(k => (S.up[k] || 0) >= UPS[k].kosten.length || k === "heilkraut")) erfolg("hain");
  }
  function reliktGefunden(g) {
    const neu = !(STAT.relikte[g] > 0);
    STAT.relikte[g] = (STAT.relikte[g] || 0) + 1; statSichern();
    if (neu) toast("🏺", t().neuesRelikt, t().relikt[g]);
    erfolgPruefen("relikte");
  }
  let toastSchlange = [], toastAn = false;
  function toast(sym, titel, txt) {
    toastSchlange.push([sym, titel, txt]);
    if (!toastAn) toastWeiter();
  }
  function toastWeiter() {
    const el = root.querySelector(".eh-toast"); if (!el) return;
    const n = toastSchlange.shift();
    if (!n) { toastAn = false; el.classList.remove("an"); return; }
    toastAn = true;
    el.innerHTML = '<span class="sym" aria-hidden="true">' + n[0] + '</span><span><strong>' + esc(n[1]) + '</strong><small>' + esc(n[2]) + '</small></span>';
    el.classList.add("an"); KLANG.edel(); vib(50);
    setTimeout(() => { el.classList.remove("an"); setTimeout(toastWeiter, 350); }, 3000);
  }

  function neuesSpiel() {
    S = {
      stufe: stufeWahl, lv: 0, leben: STUFEN[stufeWahl].leben + tal("zaeh"), punkte: 0, beutel: 0, garten: null,
      goldGesamt: 0, erlegtGesamt: 0, schaetzeGesamt: 0, up: {}, phase: "raub", tafel: "", R: null, A: null, erg: null, statistik: STAT
    };
  }
  const jsonLies = (k, d) => { try { const v = JSON.parse(lies(k, "null")); return v && typeof v === "object" ? v : d; } catch (_) { return d; } };
  const sterneLesen = st => jsonLies("imres-echohort-sterne-" + st, {});
  const freiLesen = st => { const sp = gespeichert(); return Math.min(KAMPAGNE - 1, Math.max(parseInt(lies("imres-echohort-frei-" + st, "0"), 10) || 0, sp && sp.stufe === st ? sp.lv : 0)); };
  const hainBestLesen = st => jsonLies("imres-echohort-hainbest-" + st, {});
  const upSumme = u => Object.keys(u || {}).reduce((a, k) => a + (u[k] || 0), 0);
  function fortschrittMerken() {
    if (!S || S.einzel) return;
    const st = S.stufe;
    if (S.lv > (parseInt(lies("imres-echohort-frei-" + st, "0"), 10) || 0)) schreib("imres-echohort-frei-" + st, String(Math.min(KAMPAGNE - 1, S.lv)));
    if (upSumme(S.up) >= upSumme(hainBestLesen(st))) schreib("imres-echohort-hainbest-" + st, JSON.stringify(S.up));
    const gd = gartenDaten();
    if (gd) {
      const wert = d => Object.keys(d.turme || {}).reduce((a, i) => a + (d.turme[i].wert || 0), 0) + (d.setzlinge || []).reduce((a, z) => a + (z.wert || 0), 0);
      if (wert(gd) >= wert(jsonLies("imres-echohort-gartenbest-" + st, {}))) schreib("imres-echohort-gartenbest-" + st, JSON.stringify(gd));
    }
  }
  function speichern() {
    if (!S || S.einzel) return;
    fortschrittMerken();
    /* Zweiter Tab: Hat ein anderer Tab inzwischen einen neueren Spielstand geschrieben, wird er nicht überschrieben. */
    if (!speichernErlaubt()) return;
    const k = { stufe: S.stufe, lv: S.lv, leben: S.leben, punkte: S.punkte, beutel: S.beutel, goldGesamt: S.goldGesamt, erlegtGesamt: S.erlegtGesamt, schaetzeGesamt: S.schaetzeGesamt, up: S.up, zauber: S.zauber, garten: gartenDaten(), laune: S.laune || null, kleinode: S.kleinode || [], angebot: S.angebot || null, erspart: S.erspart || 0, kampagne: KAMPAGNE,
      t: Math.max(Date.now(), (S.speicherT || 0) + 1), tab: TAB_ID };
    S.speicherT = k.t;
    schreib(SPEICHER, JSON.stringify(k));
  }
  /* Jeder Tab kennt den Zeitstempel des Spielstands, den er geladen oder zuletzt selbst geschrieben hat.
     Ist der gespeicherte neuer und von einem anderen Tab, bleibt er stehen. */
  const TAB_ID = Math.random().toString(36).slice(2, 10);
  function speichernErlaubt() {
    let v = null; try { v = JSON.parse(lies(SPEICHER, "null")); } catch (_) {}
    if (!v || typeof v !== "object") return true;
    if (v.tab === TAB_ID) return true;
    return !((v.t || 0) > (S.speicherT || 0));
  }
  function speicherLoeschen() { if (!S || speichernErlaubt()) loesch(SPEICHER); }
  function gespeichert() {
    /* Obergrenze: weit hinter allem Spielbaren im Endlos-Modus – darüber würden die Gegner-Werte unendlich */
    try { const v = JSON.parse(lies(SPEICHER, "null")); return v && STUFEN[v.stufe] && Number.isInteger(v.lv) && v.lv >= 0 && kampagneAngleichen(v) && v.lv <= KAMPAGNE + 200 ? v : null; } catch (_) { return null; }
  }
  /* Neues Gebiet angehängt? Ältere Spielstände kennen die Länge ihrer Kampagne nicht (bis Gracklstugh: 8 Gebiete = 24 Level).
     Ein Endlos-Stand wird um die neuen Level verschoben, damit er Endlos bleibt und dieselbe Runde zeigt. */
  function kampagneAngleichen(v) {
    const alt = Number.isInteger(v.kampagne) && v.kampagne > 0 ? v.kampagne : 24;
    if (alt !== KAMPAGNE && v.lv >= alt) v.lv += KAMPAGNE - alt;
    v.kampagne = KAMPAGNE;
    return true;
  }
  function laden(k) {
    neuesSpiel();
    Object.assign(S, k);
    S.speicherT = k.t || 0; delete S.tab; delete S.t;
    S.up = Object.assign({}, k.up || {});
    S.garten = k.garten && typeof k.garten === "object" ? { g: k.garten.g, turme: Object.assign({}, k.garten.turme || {}), setzlinge: (k.garten.setzlinge || []).slice() } : null;
  }
  /* ---------- Der Garten: Wächter und Tiere bleiben stehen ---------- */
  const turmKurz = T => ({ k: T.k, st: T.st, zweig: T.zweig || null, ziel: T.ziel || "vorne", tier: !!T.tier, wert: T.wert || 0, u: T.u != null ? T.u : null });
  function gartenSync() {
    if (!S || !S.garten || !S.A) return;
    const G = S.garten; G.turme = {};
    S.A.plaetze.forEach((p, i) => { if (p.turm) G.turme[i] = p.turm; });
  }
  function gartenDaten() {
    if (!S.garten) return null;
    const G = S.garten, turme = {};
    Object.keys(G.turme).forEach(i => { turme[i] = turmKurz(G.turme[i]); });
    return { g: G.g, turme, setzlinge: G.setzlinge.map(x => turmKurz(x)) };
  }
  function turmNeu(z) {
    /* Laufzeit-Zustand immer frisch: Wölfe/Falke, die beim Rundenende noch unterwegs waren,
       gibt es in der neuen Runde nicht mehr – sonst bliebe der Bau für immer stumm. */
    return Object.assign({ winkel: -Math.PI / 2, wachs: 0, ziel: "vorne" }, z,
      { cd: 0.5, ausT: 0, netz: 0, anim: 0, draussen: 0, unterwegs: false, blockiert: [] },
      z.tier ? { hp: 0, schlafT: 0, faehigT: 2 + Math.random() * 2 } : {});
  }
  function gartenVorbereiten(g, plaetze) {
    if (!S.garten) S.garten = { g, turme: {}, setzlinge: [] };
    const G = S.garten;
    if (G.g !== g) {
      /* u = wo am Weg der Wächter stand (0 = Eingang, 1 = Hort) – für „Wie zuletzt“ */
      Object.keys(G.turme).forEach(i => { const z = turmKurz(G.turme[i]); if (z.u == null) z.u = Math.min(1, +i / 27); G.setzlinge.push(z); });
      G.turme = {}; G.g = g;
    }
    plaetze.forEach((p, i) => {
      p.i = i;
      const z = G.turme[i]; if (!z) return;
      p.turm = turmNeu(z); p.turm.wachs = 1; G.turme[i] = p.turm;
      if (p.turm.tier) tierPosten(p);
    });
  }

  /* gemeinsame Effekte für beide Phasen */
  function text(x, y, s, farbe, gross, dauer) {
    y = Math.max(y, 52);
    for (let k = 0; k < 4 && S.texte.some(o => o.t < 0.7 && Math.abs(o.x - x) < 48 && Math.abs(o.y - y) < 12); k++) y -= 13;
    S.texte.push({ x, y, s, farbe: farbe || "#ebe2cc", gross: gross || 15, t: 0, dauer: dauer || 1.3 }); }
  function banner(s, farbe, dauer) { S.banner = { s, farbe: farbe || "#e0a046", t: 0, dauer: dauer || 1.8 }; }
  function funken(x, y, n, farben, tempo, gr) {
    if (ruhig) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const w = Math.random() * Math.PI * 2, v = (tempo || 80) * (0.3 + Math.random());
      S.teilchen.push({ x, y, vx: Math.cos(w) * v, vy: Math.sin(w) * v - 20, t: 0, dauer: 0.5 + Math.random() * 0.5, farbe: zufall(farben), gr: (gr || 2.5) * (0.6 + Math.random() * 0.8) });
    }
  }
  function quip(art, chance) {
    if (Math.random() > (chance == null ? 0.45 : chance) || S.quipT > 0) return;
    S.quip = { s: zufall(t().quips[art]), t: 0 }; S.quipT = 2.2;
  }

  /* ================== PHASE 1: RAUBZUG ================== */
  function raubzugStarten() {
    const lv = S.lv, g = gebietVon(lv);
    musikStart(GEB[g].musik, 0); musikWechsel(0);
    const zeit = 26 * STUFEN[S.stufe].zeit + 5 * up("zeit"); /* „+5 Sekunden“ gilt auf jeder Stufe genau so */
    S.phase = "raub";
    S.texte = []; S.teilchen = []; S.banner = null; S.quip = null; S.quipT = 0; S.blitze = [];
    S.R = {
      g, zeit, zeitMax: zeit, dinge: dingeErzeugen(lv), zorn: 0, beute: 0, saat: 0, gier: 0, schaetze: 0,
      form: "ranke", formWuerfe: 0, wild: 2 + up("wild") + tal("raubzug"), schmollT: 0, schwingT: Math.random() * 3,
      haken: { zustand: "schwingen", winkel: 0, laenge: 18, last: null }, endeWunsch: false, fertig: false, endeT: 0,
      ausbrueche: 0, gierSchritt: 130 + 24 * Math.min(lv, KAMPAGNE + 12)
    };
    regelStart(S.R);
    S.R.wertGesamt = S.R.dinge.reduce((s, d) => s + (d.wert || 0), 0);
    hintergrundRaub(g);
  }

  function dingeErzeugen(lv) {
    const g = gebietVon(lv), l = [];
    const wertF = (1 + 0.07 * Math.min(lv, KAMPAGNE) + (lv >= KAMPAGNE ? 0.08 * (lv - KAMPAGNE) : 0)) * (1 + 0.1 * up("goldnase"));
    const platz = (r, yMin, yMax) => {
      for (let v = 0; v < 80; v++) {
        const x = zw(24 + r, W - 24 - r), y = zw(yMin, yMax);
        if (abst(x, y, DREH.x, DREH.y) < 70) continue;
        if (l.every(d => abst(x, y, d.x, d.y) > d.r + r + 10)) return [x, y];
      }
      return null;
    };
    const neu = (typ, yMin, yMax, extra) => {
      const a = DINGE[typ], r = a.r * (typ === "stein" ? zw(0.85, 1.25) : 1);
      const p = platz(r, yMin, yMax); if (!p) return null;
      const d = Object.assign({ typ, x: p[0], y: p[1], r, gewicht: a.gewicht * (typ === "stein" ? r / a.r : 1), wert: Math.round(zw(a.wert[0], a.wert[1]) * (typ === "stein" ? 1 : wertF)), dreh: zw(-0.4, 0.4), seed: Math.random() }, extra || {});
      l.push(d); return d;
    };
    const tief = 150 + Math.min(150, lv * 6);
    const anz = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    for (let i = anz(1, 2) + Math.min(2, Math.floor(lv / 8)); i > 0; i--) neu("nugget", Math.min(tief + 80, 360), 425);
    if (lv >= 1 && Math.random() < 0.75) neu("relikt", 330, 428);
    if (lv >= 10 && Math.random() < 0.5) neu("relikt", 300, 428);
    for (let i = anz(1, 2) + (lv >= 6 ? 1 : 0); i > 0; i--) neu("edelstein", 250, 430);
    for (let i = anz(1, 2); i > 0; i--) neu("truhe", 220, 425, { inhalt: zufall(["gold", "gold", "gold", "gold", "gold", "saat", "saat", "mimik", "mimik", "wild"]) });
    for (let i = Math.min(7, 3 + Math.floor(lv / 4)); i > 0; i--) neu("stein", 150, 430);
    for (let i = anz(2, 3); i > 0; i--) neu("beutel", 170, 420);
    for (let i = anz(4, 5); i > 0; i--) neu("muenze", 140, 430);
    for (let i = anz(3, 4); i > 0; i--) neu("res", 140, 420);
    // Blockaden: Felsen (Bär) ab Level 2, Netze (Ratte) ab dem Unterreich
    const wertvoll = l.filter(d => ["nugget", "relikt", "edelstein", "truhe", "beutel"].includes(d.typ));
    mischen(wertvoll);
    let fels = lv >= 1 ? Math.min(3, 1 + Math.floor(lv / 6)) : 0, netz = lv >= FORMEN.ratte.ab ? 2 + (lv >= 20 ? 1 : 0) : 0;
    wertvoll.forEach(d => {
      if (netz > 0 && Math.random() < 0.5) { d.block = "netz"; netz--; }
      else if (fels > 0) { d.block = "fels"; d.gewicht += 2; fels--; }
    });
    // Tiere (nicht anfassen!) und Störenfriede (kappen die Ranke)
    const G = GEB[g];
    for (let i = (lv >= 3 ? 2 : 1); i > 0; i--) {
      const y = zw(190, 420);
      l.push({ typ: "tier", art: G.tier, x: zw(40, 360), y, by: y, r: 11, v: zw(22, 42) * (Math.random() < 0.5 ? -1 : 1), ph: Math.random() * 6 });
    }
    for (let i = lv >= 1 ? Math.min(3, 1 + Math.floor(lv / 8)) : 0; i > 0; i--) {
      const y = zw(170, 400), x = zw(50, 350);
      l.push({ typ: "stoerer", art: G.stoerer, x, y, bx: x, by: y, r: 11, v: zw(30, 55) * (Math.random() < 0.5 ? -1 : 1), ph: Math.random() * 6 });
    }
    return l;
  }

  const formDaten = () => FORMEN[S.R.form];
  const reichweite = () => 330 * formDaten().reich * (1 + 0.12 * up("ranke"));
  const hakenSpitze = h => ({ x: DREH.x + Math.sin(h.winkel) * h.laenge, y: DREH.y + Math.cos(h.winkel) * h.laenge });

  function raubTippen(p) {
    const R = S.R, h = R.haken;
    if (R.fertig) return;
    if (R.schmollT > 0) { quip("stein", 0.5); return; }
    if (h.zustand !== "schwingen") return;
    h.zustand = "raus"; h.laenge = 18; R.leerlauf = 0;
    KLANG.wurf();
  }
  function formWaehlen(k) {
    const R = S.R;
    if (R.fertig || R.form === k) return;
    if (k === "ranke") { R.form = "ranke"; R.formWuerfe = 0; KLANG.verwandeln(); funken(DREH.x, 62, 10, ["#cfe6a8", "#ebe2cc"], 60); return; }
    if (R.wild <= 0) { text(DREH.x, 120, t().ev.keineWild, "#c4564a", 15); KLANG.grummeln(); return; }
    if (R.haken.zustand !== "schwingen") return;
    R.wild--; R.form = k; R.formWuerfe = 3 + up("dauer");
    KLANG.verwandeln(); if (k === "baer") KLANG.bruellen();
    funken(DREH.x, 62, 18, ["#cfe6a8", "#ebe2cc", "#e0a046"], 90);
  }
  function genug() {
    const R = S.R; if (R.fertig) return;
    R.endeWunsch = true;
    if (R.haken.zustand === "schwingen") raubzugEnde();
  }

  function zornDazu(n) {
    const R = S.R; if (!R) return;
    R.zorn = klemm(R.zorn + n * zornFaktor(), 0, 100);
    if (R.zorn >= 100) ausbruchRaub();
  }

  function raubUpdate(dt) {
    const R = S.R, h = R.haken;
    if (S.quipT > 0) S.quipT -= dt;
    if (!R.fertig) {
      R.zeit -= dt;
      if (R.zeit <= 0) { R.zeit = 0; R.endeWunsch = true; }
    }
    R.schmollT = Math.max(0, R.schmollT - dt);
    R.zorn = Math.max(0, R.zorn - dt * 1.2);
    if (R.zorn > 70 && !S.zornTipp && !lies("imres-echohort-zorntipp", "")) { S.zornTipp = true; schreib("imres-echohort-zorntipp", "1"); text(W / 2, 140, t().ausbruchTipp, "#ebe2cc", 12, 3.5); }
    // Tiere und Störenfriede bewegen sich
    R.dinge.forEach(d => {
      if (d.typ === "tier") {
        if (d.flieht) { d.x += d.v * 5 * dt; d.y -= 30 * dt; d.alpha = (d.alpha == null ? 1 : d.alpha) - dt * 1.5; return; }
        d.ph += dt * 4; d.x += d.v * dt; d.y = d.by + (d.art === "fledermaus" ? Math.sin(d.ph) * 10 : d.art === "fisch" || d.art === "salamander" ? Math.sin(d.ph * 0.6) * 5 : -Math.abs(Math.sin(d.ph)) * 6);
        if (d.x < 20 || d.x > W - 20) { d.v *= -1; d.x = klemm(d.x, 20, W - 20); }
      } else if (d.typ === "stoerer") {
        d.ph += dt;
        if (d.art === "spinne") { d.y = d.by + Math.sin(d.ph * 1.3) * 70; d.y = klemm(d.y, 140, 430); }
        else { d.x += d.v * dt * (d.art === "rauch" ? 0.6 : 1); d.y = d.by + Math.sin(d.ph * (d.art === "rauch" ? 1.6 : 5)) * (d.art === "aal" ? 6 : d.art === "rauch" ? 16 : 12); if (d.x < 20 || d.x > W - 20) { d.v *= -1; d.x = klemm(d.x, 20, W - 20); } }
      }
    });
    R.dinge = R.dinge.filter(d => !(d.typ === "tier" && d.flieht && d.alpha <= 0));
    regelUpdate(R, dt);
    // Haken
    const f = formDaten();
    if (h.zustand === "schwingen") {
      R.schwingT += dt * (R.form === "rabe" ? 1.25 : R.form === "baer" ? 0.85 : 1);
      h.winkel = Math.sin(R.schwingT * 1.15) * 1.22;
      R.leerlauf = (R.leerlauf || 0) + dt;
      if (R.leerlauf > 3 && !R.fertig && R.schmollT <= 0) zornDazu(5 * dt);
      if (R.endeWunsch && !R.fertig) raubzugEnde();
    } else if (h.zustand === "raus") {
      h.laenge += 300 * f.schuss * dt;
      const sp = hakenSpitze(h);
      if (sp.x < 6 || sp.x > W - 6 || sp.y > LEISTE - 6 || h.laenge > reichweite()) { h.zustand = "rein"; zornDazu(7); regelLaerm(R, 12); return; }
      if (regelHaken(R, sp)) return;
      for (const d of R.dinge) {
        if (d.flieht) continue;
        if (abst(sp.x, sp.y, d.x, d.y) > d.r + 5) continue;
        treffeDing(d, sp); break;
      }
    } else if (h.zustand === "rein") {
      const last = h.last;
      const gew = last ? last.gewicht + (h.last2 ? h.last2.gewicht * 0.8 : 0) : 0;
      const v = last ? 250 * f.zug * (1 + 0.18 * up("zug")) / (0.55 + gew * 0.42) : 560;
      h.laenge -= v * dt;
      if (last) { const sp = hakenSpitze(h); last.x = sp.x; last.y = sp.y + last.r * 0.6; if (h.last2) { h.last2.x = sp.x + last.r * 0.7; h.last2.y = sp.y + last.r * 0.6 + h.last2.r; } }
      if (h.laenge <= 18) {
        h.laenge = 18; h.zustand = "schwingen";
        if (last) { h.last = null; einsammeln(last); if (h.last2) { const l2 = h.last2; h.last2 = null; einsammeln(l2); } }
        if (R.form !== "ranke") { R.formWuerfe--; if (R.formWuerfe <= 0) { R.form = "ranke"; KLANG.verwandeln(); funken(DREH.x, 62, 10, ["#cfe6a8", "#ebe2cc"], 60); } }
        if (!R.fertig && !R.dinge.some(d => ["muenze", "beutel", "nugget", "edelstein", "truhe", "res", "relikt"].includes(d.typ))) {
          text(W / 2, 250, t().ev.alles, "#e0a046", 24, 1.8); R.endeWunsch = true;
        }
      }
    }
  }

  function treffeDing(d, sp) {
    const R = S.R, h = R.haken, f = formDaten(), T = t().ev;
    if (d.typ === "tier") {
      d.flieht = true; d.v = (d.x < W / 2 ? -1 : 1) * Math.abs(d.v || 30);
      R.saat = Math.max(0, R.saat - 8);
      text(d.x, d.y - 16, T.naturfrevel, "#c4564a", 15); quip("tier", 0.8); KLANG.tier();
      h.zustand = "rein"; zornDazu(20); return;
    }
    if (d.typ === "stoerer") {
      text(sp.x, sp.y - 14, T.gekappt, "#c4564a", 15); KLANG.kappen(); funken(sp.x, sp.y, 8, ["#6f9a3a", "#3b4a2a"], 70);
      h.zustand = "rein"; h.laenge = Math.min(h.laenge, 60); zornDazu(15); return;
    }
    if (d.block === "fels" && !f.fels) { text(sp.x, sp.y - 14, T.fels, "#ebe2cc", 14); KLANG.stein(); h.zustand = "rein"; zornDazu(5); return; }
    if (d.block === "netz" && !f.netz) { text(sp.x, sp.y - 14, T.netz, "#ebe2cc", 14); KLANG.griff(); h.zustand = "rein"; zornDazu(5); return; }
    if (f.maxGewicht && d.gewicht > f.maxGewicht) { text(sp.x, sp.y - 14, T.zuSchwer, "#ebe2cc", 14); KLANG.griff(); h.zustand = "rein"; zornDazu(4); return; }
    if (d.block === "fels") { d.block = null; d.gewicht -= 2; funken(d.x, d.y, 14, ["#7a7468", "#a8a090", "#4a4640"], 110); KLANG.stein(); }
    if (d.block === "netz") { d.block = null; funken(d.x, d.y, 8, ["#ebe2cc", "#bdb6a6"], 50); }
    R.dinge.splice(R.dinge.indexOf(d), 1);
    h.last = d; h.last2 = null; h.zustand = "rein"; KLANG.griff();
    regelGriff(R, d);
    if (up("doppelgriff") && d.typ !== "stein") {
      const n = R.dinge.filter(o => ["muenze", "beutel", "nugget", "edelstein", "truhe", "res", "relikt"].includes(o.typ) && !o.block && abst(o.x, o.y, d.x, d.y) < d.r + o.r + 24 && !(f.maxGewicht && d.gewicht + o.gewicht > f.maxGewicht + 1))
        .sort((a, b) => abst(a.x, a.y, d.x, d.y) - abst(b.x, b.y, d.x, d.y))[0];
      if (n) { R.dinge.splice(R.dinge.indexOf(n), 1); h.last2 = n; text(d.x, d.y - 20, "×2", "#cfe6a8", 14, 0.8); }
    }
  }

  function einsammeln(d) {
    const R = S.R, T = t(), x = DREH.x, y = DREH.y + 20;
    if (d.typ === "stein") {
      R.beute += d.wert; text(x + 30, y, "+" + d.wert, "#a89f8f", 14); KLANG.stein(); quip("stein", 0.55); zornDazu(18); regelLaerm(R, 25); return;
    }
    if (d.typ === "res") {
      const n = Math.round(14 * (1 + 0.2 * up("ernte")));
      R.saat += n; text(x + 30, y, "+" + n + " " + T.res[R.g], "#cfe6a8", 14); KLANG.tier(); return;
    }
    if (d.typ === "truhe") {
      const sk = 1 + 0.07 * Math.min(S.lv, KAMPAGNE);
      if (d.inhalt === "mimik") { text(x, y + 10, T.ev.mimik, "#c4564a", 18); KLANG.grummeln(); funken(x, y, 10, ["#7a5638", "#c4564a"], 80); zornDazu(22); return; }
      if (d.inhalt === "saat") { const n = Math.round(26 * (1 + 0.2 * up("ernte"))); R.saat += n; text(x + 30, y, "+" + n + " " + T.res[R.g], "#cfe6a8", 15); KLANG.gold(); return; }
      if (d.inhalt === "wild") { R.wild++; text(x, y + 10, T.ev.wildPlus, "#cfe6a8", 17); KLANG.verwandeln(); return; }
      d.wert = Math.round(zw(70, 150) * sk * (1 + 0.1 * up("goldnase")));
    }
    R.beute += d.wert; R.schaetze++;
    text(x + 34, y, "+" + d.wert, "#e0a046", d.wert >= 100 ? 20 : 16);
    funken(x, y - 10, d.wert >= 100 ? 16 : 8, ["#e0a046", "#ffd34d", "#ebe2cc"], 70);
    if (d.typ === "edelstein" || d.typ === "relikt") KLANG.edel(); else KLANG.gold();
    if (d.typ === "relikt") { text(W / 2, 150, T.relikt[R.g] + "!", "#ffd34d", 20, 1.8); reliktGefunden(R.g); }
    quip("gold", 0.3);
    const g = Math.min(5, Math.floor(R.beute / R.gierSchritt));
    if (g > R.gier) { R.gier = g; banner(T.ev.gier(g), "#ffd34d", 1.4); }
  }

  function ausbruchRaub() {
    const R = S.R, T = t();
    R.zorn = 25; R.ausbrueche++;
    if (R.ausbrueche >= 3) erfolg("zorn3");
    vib(90);
    const wh = up("wildherz");
    const wahl = [["feuerball", 30 + 5 * wh], ["blitz", 25 + 5 * wh], ["baer", 25 + 5 * wh], ["grummeln", Math.max(4, 20 - 8 * wh)]];
    let r = Math.random() * wahl.reduce((s, w) => s + w[1], 0), art = "feuerball";
    for (const [k, w] of wahl) { r -= w; if (r <= 0) { art = k; break; } }
    quip("zorn", 1);
    banner(T.ausbruch[art], art === "grummeln" ? "#a89f8f" : "#c4564a", 1.6);
    if (art === "feuerball") {
      const ziele = R.dinge.filter(d => d.typ === "stein" || d.block === "fels");
      const z = ziele.length ? zufall(ziele) : { x: zw(80, 320), y: zw(220, 400) };
      const rad = 80;
      R.dinge = R.dinge.filter(d => {
        if (abst(d.x, d.y, z.x, z.y) > rad + d.r) return true;
        if (d.typ === "stein" || d.typ === "stoerer" || d.typ === "res") return false;
        if (d.typ === "tier") { d.flieht = true; return true; }
        if (d.block === "fels") { d.block = null; d.gewicht -= 2; }
        if (d.block === "netz") d.block = null;
        return true;
      });
      S.blitze.push({ art: "explosion", x: z.x, y: z.y, r: rad, t: 0, dauer: 0.6 });
      funken(z.x, z.y, 40, ["#e0a046", "#ffd34d", "#c4564a", "#ff8a3a"], 180, 3.5);
      KLANG.boom(); S.beben = 0.4;
    } else if (art === "blitz") {
      const ziele = mischen(R.dinge.filter(d => d.typ === "stein" || d.typ === "stoerer" || d.block === "fels")).slice(0, 4);
      ziele.forEach(d => {
        S.blitze.push({ art: "blitz", x1: DREH.x, y1: DREH.y, x2: d.x, y2: d.y, t: 0, dauer: 0.45, seed: Math.random() });
        funken(d.x, d.y, 14, ["#f3e27a", "#ebe2cc"], 120);
        if (d.block === "fels") { d.block = null; d.gewicht -= 2; } else R.dinge.splice(R.dinge.indexOf(d), 1);
      });
      KLANG.blitz();
    } else if (art === "baer") {
      R.form = "baer"; R.formWuerfe = 3; KLANG.bruellen(); funken(DREH.x, 62, 20, ["#a8783e", "#5a4430"], 100);
    } else {
      R.schmollT = 3; KLANG.grummeln();
    }
  }

  /* ================== GEBIETSREGELN IM RAUBZUG ================== */
  const WERTVOLL = ["muenze", "beutel", "nugget", "edelstein", "truhe", "res", "relikt"];
  const freiesDing = d => WERTVOLL.includes(d.typ) && !d.block && !d.lore;
  function rings(R, cx, cy, n, rMin, rMax, yMax) {
    const kand = R.dinge.filter(d => ["nugget", "edelstein", "beutel", "relikt", "truhe"].includes(d.typ) && !d.block).slice(0, n);
    kand.forEach((d, i) => {
      for (let v = 0; v < 40; v++) {
        const w = -Math.PI * (0.05 + 0.9 * ((i + 0.5) / n)) + zw(-0.2, 0.2), r = zw(rMin, rMax);
        const x = klemm(cx + Math.cos(w) * r, 24, W - 24), y = klemm(cy + Math.sin(w) * r * 0.8, 150, yMax);
        if (R.dinge.every(o => o === d || abst(x, y, o.x, o.y) > o.r + d.r + 4)) { d.x = x; d.y = y; break; }
      }
      d.hort = true;
    });
    // nichts darf auf dem Schläfer liegen
    R.dinge.forEach(d => { if (!d.hort && abst(d.x, d.y, cx, cy) < 46) d.y = Math.max(150, cy - 80 - Math.random() * 60); });
  }
  function regelStart(R) {
    const G = GEB[R.g], innen = innenVon(S.lv);
    R.regel = G.regel; R.rt = 0;
    if (R.regel === "goblindieb") { R.dieb = null; R.diebT = zw(4, 7); }
    else if (R.regel === "laterne") {
      const n = 1 + (innen >= 1 ? 1 : 0) + (S.lv >= KAMPAGNE ? 1 : 0), ys = mischen([200, 270, 340, 400]).slice(0, n);
      R.wachen = ys.map(y => ({ x: zw(40, 360), y, v: zw(32, 48) * (Math.random() < 0.5 ? -1 : 1) * (1 + innen * 0.12), r: 44 + innen * 4, alarm: 0 }));
    } else if (R.regel === "bugbear") {
      R.schlaefer = { x: zw(100, 300), y: 412, laerm: 0, wachT: 0 };
      rings(R, R.schlaefer.x, R.schlaefer.y, 3, 40, 62, 430);
    } else if (R.regel === "loren") {
      R.loren = []; R.loreT = 0.5; R.schiene = 272;
      R.dinge.forEach(d => { if (d.y > R.schiene - 34 && d.y < R.schiene + 26) d.y = d.y < R.schiene ? R.schiene - 40 - d.r : R.schiene + 34 + d.r; });
    } else if (R.regel === "venomfang") {
      R.drache = { x: zw(110, 290), y: 410, wach: 0, giftT: 0 };
      rings(R, R.drache.x, R.drache.y, 4, 44, 70, 432);
      R.dinge.filter(d => d.hort).forEach(d => { d.wert = Math.round(d.wert * 1.35); });
    } else if (R.regel === "dunkel") {
      R.pilze = [];
      for (let i = 0; i < 6; i++) R.pilze.push({ x: zw(30, 370), y: zw(160, 430), r: zw(36, 50), ph: Math.random() * 6 });
    } else if (R.regel === "stroemung") {
      R.dinge.forEach(d => { d.strom = (Math.random() < 0.5 ? -1 : 1) * zw(9, 20) * (1 + innen * 0.15); });
    } else if (R.regel === "geysir") { R.geysire = []; R.geysirT = zw(2, 3.5); }
    else if (R.regel === "lavastrom") {
      /* zwei Ströme quer durch die Halle; sie wallen abwechselnd auf. Unten der Goldberg mit Themberchauds Gold. */
      R.stroeme = [zw(212, 232), zw(316, 336)].map((y, i) => ({ y, h: 11, zustand: "ruhig", t: 0, dauer: zw(2.4, 3.4) + i * 1.6, v: (i ? -1 : 1) * zw(20, 30), ph: Math.random() * 6 }));
      R.treibT = zw(1, 2);
      R.berg = { x: zw(130, 270), y: 440 };
      rings(R, R.berg.x, R.berg.y, 5, 30, 62, 434);
      R.dinge.filter(d => d.hort).forEach(d => { d.wert = Math.round(d.wert * 1.3); });
      R.dinge.forEach(d => {
        if (!(WERTVOLL.includes(d.typ) || d.typ === "stein")) return;
        R.stroeme.forEach(st => { if (Math.abs(d.y - st.y) < st.h + d.r + 4) d.y = d.y < st.y ? st.y - st.h - d.r - 6 : st.y + st.h + d.r + 6; });
      });
    }
  }
  function regelLaerm(R, n) {
    if (R.regel === "bugbear" && R.schlaefer && R.schlaefer.wachT <= 0) R.schlaefer.laerm = Math.min(100, R.schlaefer.laerm + n);
  }
  function regelGriff(R, d) {
    if (R.regel === "bugbear" && abst(d.x, d.y, R.schlaefer.x, R.schlaefer.y) < 80) regelLaerm(R, 18);
    if (R.regel === "venomfang" && d.hort) R.drache.wach = Math.min(100, R.drache.wach + 26 + d.wert / 12);
    /* Echo rechnet schon, was er sich vom Goldberg kaufen könnte */
    if (R.regel === "lavastrom" && d.hort && S.quipT <= 0 && Math.random() < 0.75) { S.quip = { s: zufall(t().rev.rechnet), t: 0 }; S.quipT = 2.4; }
  }
  function wegnehmen(R, d) { const i = R.dinge.indexOf(d); if (i >= 0) R.dinge.splice(i, 1); }
  function regelUpdate(R, dt) {
    const T = t().rev, h = R.haken, sp = hakenSpitze(h);
    R.rt += dt;
    if (R.regel === "goblindieb") {
      if (!R.dieb) {
        R.diebT -= dt;
        const ziele = R.dinge.filter(d => freiesDing(d) && d.y > 150);
        if (R.diebT <= 0 && ziele.length && !R.fertig) {
          const z = zufall(ziele), links = z.x > W / 2;
          R.dieb = { x: links ? W + 14 : -14, y: z.y, ziel: z, item: null, zustand: "hin", links, ph: 0 };
        }
      } else {
        const D = R.dieb; D.ph += dt;
        if (D.zustand === "hin") {
          if (!R.dinge.includes(D.ziel)) { const z = R.dinge.filter(d => freiesDing(d) && d.y > 150).sort((a, b) => abst(a.x, a.y, D.x, D.y) - abst(b.x, b.y, D.x, D.y))[0]; if (!z) { D.zustand = "flucht"; return; } D.ziel = z; }
          const dx = D.ziel.x - D.x, dy = D.ziel.y - D.y, l = Math.hypot(dx, dy), v = 48 * dt;
          D.links = dx < 0;
          if (l < v + 4) { wegnehmen(R, D.ziel); D.item = D.ziel; D.zustand = "weg"; D.links = D.x < W / 2; }
          else { D.x += dx / l * v; D.y += dy / l * v; }
        } else {
          D.x += (D.links ? -1 : 1) * (D.zustand === "flucht" ? 120 : 52) * dt;
          if (D.item) { D.item.x = D.x; D.item.y = D.y - 14; }
          if (D.x < -20 || D.x > W + 20) {
            if (D.item) { text(klemm(D.x, 80, W - 80), D.y, T.goblinWeg, "#c4564a", 13); zornDazu(10); KLANG.grummeln(); }
            R.dieb = null; R.diebT = zw(5, 9);
          }
        }
      }
    } else if (R.regel === "laterne") {
      R.wachen.forEach(w => { w.x += w.v * dt; if (w.x < 24 || w.x > W - 24) { w.v *= -1; w.x = klemm(w.x, 24, W - 24); } w.alarm = Math.max(0, w.alarm - dt); });
    } else if (R.regel === "bugbear") {
      const B = R.schlaefer;
      if (B.wachT > 0) { B.wachT -= dt; }
      else {
        B.laerm = Math.max(0, B.laerm - 3 * dt);
        if (h.zustand === "raus" && abst(sp.x, sp.y, B.x, B.y) < 55) B.laerm = Math.min(100, B.laerm + 30 * dt);
        if (B.laerm >= 100) {
          const n = Math.round(R.beute * 0.15); R.beute -= n; B.laerm = 0; B.wachT = 2.4;
          banner(T.bugbearWach(n), "#c4564a", 1.8); KLANG.bruellen(); S.beben = 0.5; zornDazu(20); vib(120);
        }
      }
    } else if (R.regel === "loren") {
      R.loreT -= dt;
      if (R.loreT <= 0 && !R.fertig) {
        R.loreT = zw(2.6, 4.2);
        const links = Math.random() < 0.5, v = zw(46, 70) * (1 + innenVon(S.lv) * 0.12) * (links ? 1 : -1);
        const lore = { x: links ? -30 : W + 30, v };
        const r = Math.random(), typ = r < 0.12 && S.lv >= 1 ? "relikt" : r < 0.42 ? "nugget" : r < 0.7 ? "edelstein" : r < 0.85 ? "res" : "beutel";
        const a = DINGE[typ], wf = (1 + 0.07 * Math.min(S.lv, KAMPAGNE)) * (1 + 0.1 * up("goldnase"));
        const d = { typ, x: lore.x, y: R.schiene - 14, r: a.r * (typ === "nugget" ? 0.8 : 1), gewicht: a.gewicht * (typ === "nugget" ? 0.8 : 1), wert: Math.round(zw(a.wert[0], a.wert[1]) * wf * 1.1), dreh: 0, seed: Math.random(), lore };
        lore.item = d; R.loren.push(lore); R.dinge.push(d);
      }
      R.loren.forEach(L => { L.x += L.v * dt; if (L.item && R.dinge.includes(L.item)) { L.item.x = L.x; L.item.y = R.schiene - 14; } });
      R.loren = R.loren.filter(L => { const raus = L.x < -40 || L.x > W + 40; if (raus && L.item) wegnehmen(R, L.item); return !raus; });
    } else if (R.regel === "venomfang") {
      const D = R.drache;
      if (D.giftT > 0) D.giftT -= dt;
      else {
        D.wach = Math.max(0, D.wach - 1.5 * dt);
        if (h.zustand === "raus" && abst(sp.x, sp.y, D.x, D.y) < 60) D.wach = Math.min(100, D.wach + 18 * dt);
        if (D.wach >= 100) { D.giftT = 5; D.wach = 35; banner(T.drache, "#8ac24a", 1.8); KLANG.bruellen(); KLANG.puff(); S.beben = 0.4; vib(120); }
      }
    } else if (R.regel === "stroemung") {
      R.dinge.forEach(d => {
        if (!d.strom || d.typ === "tier" || d.typ === "stoerer") return;
        d.x += d.strom * (0.75 + 0.25 * Math.sin(R.rt * 0.8 + d.y / 40)) * dt;
        if (d.x < -d.r - 4) d.x = W + d.r; else if (d.x > W + d.r + 4) d.x = -d.r;
      });
    } else if (R.regel === "geysir") {
      R.geysirT -= dt;
      if (R.geysirT <= 0 && !R.fertig) {
        R.geysirT = zw(2.4, 4) / (1 + innenVon(S.lv) * 0.15);
        const ziele = R.dinge.filter(freiesDing);
        const x = ziele.length && Math.random() < 0.65 ? klemm(zufall(ziele).x + zw(-10, 10), 24, W - 24) : zw(30, W - 30);
        R.geysire.push({ x, t: 0, warn: 1.7, aus: 1.3, w: 36, getroffen: false });
      }
      R.geysire.forEach(g => {
        g.t += dt;
        if (g.t < g.warn || g.t > g.warn + g.aus) return;
        if (!g.getroffen) {
          g.getroffen = true; S.beben = 0.25; KLANG.boom(); vib(40);
          let n = 0;
          R.dinge.slice().forEach(d => { if (WERTVOLL.includes(d.typ) && Math.abs(d.x - g.x) < g.w / 2 + d.r * 0.4 && d.y > 110) { wegnehmen(R, d); n++; funken(d.x, d.y, 10, ["#ff8a3a", "#ffd34d", "#c4564a"], 90); } });
          if (n) text(g.x, 200, T.geschmolzen, "#ff8a3a", 15);
        }
        if (h.zustand !== "schwingen" && Math.abs(sp.x - g.x) < g.w / 2 && sp.y > 110 && !h.verbrannt) {
          h.verbrannt = true;
          if (h.last) { funken(sp.x, sp.y, 12, ["#ff8a3a", "#ffd34d"], 90); h.last = null; h.last2 = null; }
          h.zustand = "rein"; text(sp.x, sp.y - 16, T.verbrannt, "#ff8a3a", 15); zornDazu(12); KLANG.grummeln();
        }
      });
      if (h.zustand === "schwingen") h.verbrannt = false;
      R.geysire = R.geysire.filter(g => g.t < g.warn + g.aus + 0.3);
    } else if (R.regel === "lavastrom") {
      const innen = innenVon(S.lv);
      R.stroeme.forEach(st => {
        st.t += dt; st.ph += dt;
        if (st.t < st.dauer) return;
        st.t = 0;
        if (st.zustand === "ruhig") { st.zustand = "warn"; st.dauer = 1.4 - innen * 0.1; if (!R.walltText) { R.walltText = true; text(W / 2, st.y - 30, T.wallt, "#ff8a3a", 14, 1.6); } }
        else if (st.zustand === "warn") {
          st.zustand = "heiss"; st.dauer = 1.5 + innen * 0.3; S.beben = 0.2; KLANG.boom(); vib(30);
          let n = 0;
          R.dinge.slice().forEach(d => { if (d.treib === st) { wegnehmen(R, d); n++; funken(d.x, d.y, 10, ["#ff8a3a", "#ffd34d", "#c4564a"], 80); } });
          if (n) text(W / 2, st.y - 18, T.geschmolzen, "#ff8a3a", 14);
        } else { st.zustand = "ruhig"; st.dauer = zw(2.6, 4.2) / (1 + innen * 0.15); }
      });
      // Treibgut: halb geschmolzene Schätze ziehen im ruhigen Strom vorbei
      R.treibT -= dt;
      if (R.treibT <= 0 && !R.fertig) {
        R.treibT = zw(2.2, 3.6);
        const st = zufall(R.stroeme);
        if (st.zustand === "ruhig" && R.dinge.filter(d => d.treib).length < 3) {
          const r = Math.random(), typ = r < 0.35 ? "nugget" : r < 0.6 ? "edelstein" : r < 0.8 ? "beutel" : "muenze";
          const a = DINGE[typ], wf = (1 + 0.07 * Math.min(S.lv, KAMPAGNE)) * (1 + 0.1 * up("goldnase")), x0 = st.v > 0 ? -16 : W + 16;
          R.dinge.push({ typ, x: x0, y: st.y, r: a.r * (typ === "nugget" ? 0.8 : 1), gewicht: a.gewicht * (typ === "nugget" ? 0.8 : 1), wert: Math.round(zw(a.wert[0], a.wert[1]) * wf * 1.15), dreh: 0, seed: Math.random(), treib: st });
        }
      }
      R.dinge = R.dinge.filter(d => { if (!d.treib) return true; d.x += d.treib.v * dt; d.y = d.treib.y + Math.sin(R.rt * 2 + d.seed * 6) * 2; return d.x > -30 && d.x < W + 30; });
      // aufwallende Lava verbrennt die Ranke, wenn sie hindurchreicht
      if (h.zustand !== "schwingen" && !h.verbrannt) {
        const st = R.stroeme.find(q => q.zustand === "heiss" && sp.y > q.y - q.h);
        if (st) {
          h.verbrannt = true;
          if (h.last) { funken(sp.x, sp.y, 12, ["#ff8a3a", "#ffd34d"], 90); h.last = null; h.last2 = null; text(sp.x, sp.y - 30, T.geschmolzen, "#ff8a3a", 14); }
          const kx = DREH.x + (sp.x - DREH.x) * (st.y - DREH.y) / Math.max(1, sp.y - DREH.y);
          funken(kx, st.y, 14, ["#ff8a3a", "#ffd34d", "#c4564a"], 100);
          h.zustand = "rein"; text(kx, st.y - 16, T.verbrannt, "#ff8a3a", 15); zornDazu(12); KLANG.grummeln();
        }
      }
      if (h.zustand === "schwingen") h.verbrannt = false;
    }
  }
  function regelHaken(R, sp) {
    const T = t().rev, h = R.haken;
    if (R.regel === "goblindieb" && R.dieb && R.dieb.zustand !== "flucht" && abst(sp.x, sp.y, R.dieb.x, R.dieb.y - 4) < 16) {
      const D = R.dieb;
      if (D.item) { h.last = D.item; h.last.lore = null; D.item = null; text(D.x, D.y - 20, T.erwischt, "#ffd34d", 15); KLANG.griff(); }
      else { R.beute += 15; text(D.x, D.y - 20, T.goblinFlieht, "#ffd34d", 14); KLANG.gold(); }
      D.zustand = "flucht"; D.links = D.x < W / 2; h.zustand = "rein";
      return true;
    }
    if (R.regel === "laterne") {
      for (const w of R.wachen) {
        if (abst(sp.x, sp.y, w.x, w.y) < w.r) {
          w.alarm = 1.2; h.zustand = "rein"; R.zeit = Math.max(0, R.zeit - 3);
          text(sp.x, sp.y - 16, T.wache, "#e0a046", 14); zornDazu(12); KLANG.grummeln(); vib(60);
          return true;
        }
      }
    }
    if (R.regel === "venomfang" && R.drache.giftT > 0 && abst(sp.x, sp.y, R.drache.x, R.drache.y - 50) < 100) {
      h.zustand = "rein"; R.zeit = Math.max(0, R.zeit - 2);
      text(sp.x, sp.y - 16, T.gift, "#8ac24a", 14); zornDazu(10); KLANG.puff();
      return true;
    }
    return false;
  }
  function istHell(R, x, y) {
    if (y < 110) return true;
    const sp = hakenSpitze(R.haken);
    if (abst(x, y, DREH.x, DREH.y + 10) < 80) return true;
    if (R.haken.zustand !== "schwingen" && abst(x, y, sp.x, sp.y) < 46) return true;
    return R.pilze.some(p => abst(x, y, p.x, p.y) < p.r * 0.85);
  }
  let dunkelLw = null;
  function dunkelMalen(x, R, zeit) {
    if (!dunkelLw) { dunkelLw = document.createElement("canvas"); dunkelLw.width = W; dunkelLw.height = H; }
    const c = dunkelLw.getContext("2d");
    c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, W, H);
    c.fillStyle = "rgba(3,2,8,.94)"; c.fillRect(0, 104, W, LEISTE - 104);
    c.globalCompositeOperation = "destination-out";
    const loch = (lx, ly, r) => { const g = c.createRadialGradient(lx, ly, r * 0.2, lx, ly, r); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.6, "rgba(0,0,0,.85)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); c.arc(lx, ly, r, 0, Math.PI * 2); c.fill(); };
    loch(DREH.x, DREH.y + 10, 95);
    const sp = hakenSpitze(R.haken); loch(sp.x, sp.y, R.haken.zustand === "schwingen" ? 30 : 56);
    R.pilze.forEach(p => loch(p.x, p.y, p.r * (0.92 + Math.sin(zeit * 2 + p.ph) * 0.08)));
    R.dinge.forEach(d => { if (d.typ === "edelstein") loch(d.x, d.y, 16 + Math.sin(zeit * 3 + d.seed * 9) * 3); else if (d.typ === "relikt") loch(d.x, d.y, 20); });
    c.globalCompositeOperation = "source-over";
    x.drawImage(dunkelLw, 0, 0, W, H);
  }
  function regelMalUnten(x, R, zeit) {
    if (R.regel === "loren") {
      R.loren.forEach(L => {
        x.save(); x.translate(L.x, R.schiene);
        x.fillStyle = "#4a443c"; x.beginPath(); x.moveTo(-20, -18); x.lineTo(20, -18); x.lineTo(16, 6); x.lineTo(-16, 6); x.closePath(); x.fill();
        x.strokeStyle = "#7a7468"; x.lineWidth = 1.5; x.stroke();
        x.strokeStyle = "#2a2620"; x.beginPath(); x.moveTo(-18, -8); x.lineTo(18, -8); x.stroke();
        const dreh = L.x / 7;
        [-11, 11].forEach(wx => { x.fillStyle = "#2a2620"; kreis(x, wx, 9, 5); x.strokeStyle = "#8a8070"; x.lineWidth = 1; x.beginPath(); x.moveTo(wx + Math.cos(dreh) * 4, 9 + Math.sin(dreh) * 4); x.lineTo(wx - Math.cos(dreh) * 4, 9 - Math.sin(dreh) * 4); x.stroke(); });
        x.restore();
      });
    } else if (R.regel === "bugbear") {
      const B = R.schlaefer, wach = B.wachT > 0;
      x.save(); x.translate(B.x, B.y + (wach ? -8 : 0));
      x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 0, 18, 42, 8);
      x.fillStyle = "#7a5a32"; oval(x, 0, wach ? -4 : 6, 34, wach ? 22 : 15);
      x.fillStyle = "#8a6a3a"; oval(x, -24, wach ? -14 : 0, 15, 13);
      x.fillStyle = "#6b4a2a"; kreis(x, -33, wach ? -25 : -10, 5); kreis(x, -16, wach ? -26 : -11, 5);
      x.fillStyle = "#c9a878"; oval(x, -32, wach ? -9 : 4, 6, 4.5);
      if (wach) { x.fillStyle = "#c4564a"; kreis(x, -28, -16, 2); kreis(x, -20, -16, 2); x.fillStyle = "#2a1408"; oval(x, -30, -4, 5, 3.5); x.fillStyle = "#efe6cf"; x.fillRect(-33, -6, 1.5, 3); x.fillRect(-28.5, -6, 1.5, 3); }
      else { x.strokeStyle = "#2a1c12"; x.lineWidth = 1.4; x.beginPath(); x.arc(-28, -1, 2.2, 0.2, Math.PI - 0.2); x.stroke(); x.beginPath(); x.arc(-20, -1, 2.2, 0.2, Math.PI - 0.2); x.stroke(); }
      x.fillStyle = "#6b4a2a"; oval(x, 24, wach ? 4 : 12, 10, 6); oval(x, -6, wach ? 10 : 15, 10, 5);
      x.restore();
      if (!wach) { x.font = "700 " + (11 + Math.sin(zeit * 2) * 2) + "px " + FONT_B; x.fillStyle = "rgba(235,226,204,.7)"; x.textAlign = "center"; x.fillText("z", B.x - 10, B.y - 26 - (zeit * 12 % 14)); x.fillText("Z", B.x - 2, B.y - 34 - ((zeit * 12 + 7) % 14)); }
      laermBalken(x, B.x, B.y + 26, B.laerm / 100, "🔊", B.laerm > 70 ? "#c4564a" : "#e0a046");
    } else if (R.regel === "venomfang") {
      const D = R.drache, wach = D.giftT > 0, atem = Math.sin(zeit * 1.6) * 1.5;
      x.save(); x.translate(D.x, D.y);
      x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 0, 18, 50, 9);
      x.strokeStyle = "#3d6a2a"; x.lineWidth = 9; x.lineCap = "round"; x.beginPath(); x.moveTo(30, 8); x.quadraticCurveTo(52, 2, 44, -12); x.stroke();
      const g = x.createRadialGradient(-6, -6, 4, 0, 4, 40); g.addColorStop(0, "#6fa04a"); g.addColorStop(1, "#2f5022");
      x.fillStyle = g; oval(x, 0, 4 - atem, 38, 17 + atem);
      x.fillStyle = "#4d7a3a"; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(-20 + i * 10, -10 - atem); x.lineTo(-15 + i * 10, -20 - atem); x.lineTo(-10 + i * 10, -10 - atem); x.fill(); }
      x.fillStyle = "#2f5022"; x.beginPath(); x.moveTo(-8, -8); x.quadraticCurveTo(-14, -34, 8, -30); x.lineTo(14, -18); x.closePath(); x.fill(); x.fillStyle = "rgba(111,160,74,.5)"; x.beginPath(); x.moveTo(-6, -12); x.quadraticCurveTo(-10, -28, 6, -27); x.lineTo(10, -18); x.fill();
      x.fillStyle = "#4d7a3a"; oval(x, -34, 4, 13, 9);
      x.fillStyle = "#2f5022"; x.beginPath(); x.moveTo(-36, -4); x.lineTo(-30, -14); x.lineTo(-28, -3); x.fill();
      if (wach) { x.fillStyle = "#ffd34d"; oval(x, -37, 1, 2.5, 2); } else { x.strokeStyle = "#1a2a12"; x.lineWidth = 1.3; x.beginPath(); x.arc(-37, 1, 2.4, 0.2, Math.PI - 0.2); x.stroke(); }
      x.restore();
      if (!wach) { x.font = "700 12px " + FONT_B; x.fillStyle = "rgba(207,230,168,.7)"; x.textAlign = "center"; x.fillText("z", D.x - 44, D.y - 18 - (zeit * 10 % 14)); }
      laermBalken(x, D.x, D.y + 28, D.wach / 100, "🐉", D.wach > 70 ? "#c4564a" : "#8ac24a");
    } else if (R.regel === "dunkel") {
      R.pilze.forEach(p => { x.fillStyle = "rgba(196,154,224,.35)"; kreis(x, p.x, p.y, 7); x.fillStyle = "#e8dcd0"; x.fillRect(p.x - 1, p.y - 2, 2, 6); x.fillStyle = "#c49ae0"; oval(x, p.x, p.y - 2, 5, 3); x.fillStyle = "#c49ae0"; oval(x, p.x + 7, p.y + 2, 3, 2); });
    } else if (R.regel === "stroemung") {
      for (let i = 0; i < 10; i++) { const bx = (i * 47 + zeit * 20 * (i % 2 ? 1 : -1)) % (W + 20), by = LEISTE - ((zeit * 25 + i * 53) % (LEISTE - 110)); x.strokeStyle = "rgba(159,214,236,.35)"; x.lineWidth = 1; x.beginPath(); x.arc((bx + W + 20) % (W + 20) - 10, by, 2 + (i % 3), 0, Math.PI * 2); x.stroke(); }
      x.strokeStyle = "rgba(159,214,236,.08)"; x.lineWidth = 2;
      for (let y = 150; y < LEISTE; y += 60) { x.beginPath(); for (let xx = 0; xx <= W; xx += 20) { const yy = y + Math.sin(xx / 40 + zeit * 1.5) * 4; xx ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
    } else if (R.regel === "lavastrom") {
      malGoldberg(x, R.berg, zeit);
      R.stroeme.forEach(st => malLavastrom(x, st, zeit));
    }
  }
  /* Themberchauds Goldberg: Münzen, Kelche, halb geschmolzene Schätze – und ein goldener Hund obendrauf */
  function malGoldberg(x, B, zeit) {
    x.save(); x.translate(B.x, B.y);
    x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 0, 6, 92, 12);
    const g = x.createRadialGradient(-14, -34, 6, 0, 0, 96); g.addColorStop(0, "#fff0a0"); g.addColorStop(0.35, "#e8b23a"); g.addColorStop(1, "#7a4a14");
    x.fillStyle = g; x.beginPath(); x.moveTo(-90, 6); x.quadraticCurveTo(-58, -30, -18, -44); x.quadraticCurveTo(0, -50, 20, -43); x.quadraticCurveTo(60, -28, 90, 6); x.closePath(); x.fill();
    const rr = lcg(Math.floor(B.x * 13) + 5);
    for (let i = 0; i < 46; i++) { const px = (rr() - 0.5) * 160, py = -rr() * 44 * (1 - Math.abs(px) / 95) + 2; x.fillStyle = rr() < 0.5 ? "#ffd34d" : "#c98a3a"; oval(x, px, py, 3.4, 1.6, rr() - 0.5); }
    x.fillStyle = "#c4564a"; kreis(x, -30, -14, 2.2); x.fillStyle = "#4aa0b0"; kreis(x, 34, -10, 2); x.fillStyle = "#6fbf5a"; kreis(x, 8, -30, 1.8);
    // ein umgekippter Kelch und der goldene Hund
    x.fillStyle = "#d8a83a"; x.beginPath(); x.moveTo(44, -8); x.lineTo(56, -14); x.lineTo(58, -8); x.lineTo(48, -3); x.fill();
    x.save(); x.translate(-6, -46);
    x.fillStyle = "#c98a2a"; oval(x, 0, 0, 9, 4.5); kreis(x, -9, -5, 4); x.fillRect(-6, 1, 2, 5); x.fillRect(4, 1, 2, 5);
    x.beginPath(); x.moveTo(-11, -8); x.lineTo(-9, -12); x.lineTo(-7, -8); x.fill(); x.strokeStyle = "#c98a2a"; x.lineWidth = 2; x.beginPath(); x.moveTo(8, -1); x.quadraticCurveTo(13, -6, 11, -10); x.stroke();
    x.fillStyle = "rgba(255,248,210,.7)"; oval(x, -10, -7, 1.5, 1);
    x.restore();
    x.restore();
  }
  function malLavastrom(x, st, zeit) {
    const heiss = st.zustand === "heiss", warn = st.zustand === "warn", u = warn ? st.t / st.dauer : 0, h = st.h + (heiss ? 3 + Math.sin(zeit * 9) * 1.5 : 0);
    x.save();
    x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(0, st.y - h - 3, W, h * 2 + 6);
    const g = x.createLinearGradient(0, st.y - h, 0, st.y + h);
    if (heiss) { g.addColorStop(0, "#ffd27a"); g.addColorStop(0.5, "#ff8a2a"); g.addColorStop(1, "#c4361a"); }
    else { const a = 0.55 + u * 0.45; g.addColorStop(0, "rgba(140,40,16," + a + ")"); g.addColorStop(0.5, "rgba(" + Math.round(200 + u * 55) + "," + Math.round(70 + u * 60) + ",30," + a + ")"); g.addColorStop(1, "rgba(90,24,10," + a + ")"); }
    x.fillStyle = g; x.beginPath(); x.moveTo(0, st.y - h);
    for (let xx = 0; xx <= W; xx += 16) x.lineTo(xx, st.y - h + Math.sin(xx / 23 + st.ph * 1.3) * 1.6);
    for (let xx = W; xx >= 0; xx -= 16) x.lineTo(xx, st.y + h + Math.sin(xx / 19 - st.ph * 1.1) * 1.6);
    x.closePath(); x.fill();
    if (!heiss) { // dunkle Kruste, die mit dem Strom zieht
      x.fillStyle = "rgba(40,16,10," + (0.6 - u * 0.4) + ")";
      for (let i = 0; i < 9; i++) { const kx = ((i * 53 + st.ph * st.v) % (W + 60) + W + 60) % (W + 60) - 30; oval(x, kx, st.y + Math.sin(i * 2.3) * 3, 14 + (i % 3) * 5, 3.2, Math.sin(i) * 0.2); }
    }
    x.strokeStyle = heiss ? "rgba(255,230,160,.8)" : "rgba(255,150,60," + (0.25 + u * 0.5) + ")"; x.lineWidth = 1;
    x.beginPath(); for (let xx = 0; xx <= W; xx += 16) { const yy = st.y + Math.sin(xx / 30 + st.ph * 2) * (h * 0.4); xx ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke();
    if (warn) {
      for (let i = 0; i < 5; i++) { const bx = (i * 87 + st.ph * 37) % W, br = 1.5 + ((st.ph * 3 + i) % 1) * 3; x.strokeStyle = "rgba(255,210,120," + (0.4 + u * 0.5) + ")"; x.beginPath(); x.arc(bx, st.y - 2, br, 0, Math.PI * 2); x.stroke(); }
      x.font = "13px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.globalAlpha = 0.5 + Math.sin(zeit * 14) * 0.4; x.fillText("⚠️", 18, st.y - h - 9); x.fillText("⚠️", W - 18, st.y - h - 9);
    }
    if (heiss) {
      x.globalCompositeOperation = "lighter";
      for (let i = 0; i < 14; i++) { const fx = (i * 31 + Math.sin(zeit * 3 + i) * 6) % W, fh = 8 + ((zeit * 5 + i * 0.37) % 1) * 14; const fg = x.createLinearGradient(0, st.y - h - fh, 0, st.y - h + 2); fg.addColorStop(0, "rgba(255,200,90,0)"); fg.addColorStop(1, "rgba(255,140,40,.55)"); x.fillStyle = fg; x.beginPath(); x.moveTo(fx - 5, st.y - h + 2); x.quadraticCurveTo(fx, st.y - h - fh * 0.5, fx + Math.sin(zeit * 9 + i) * 3, st.y - h - fh); x.quadraticCurveTo(fx + 2, st.y - h - fh * 0.4, fx + 5, st.y - h + 2); x.fill(); }
    }
    x.restore();
  }
  function laermBalken(x, cx, cy, u, sym, farbe) {
    x.fillStyle = "rgba(9,8,15,.7)"; x.fillRect(cx - 34, cy - 5, 68, 10);
    x.fillStyle = farbe; x.fillRect(cx - 20, cy - 3, 52 * klemm(u, 0, 1), 6);
    x.font = "9px " + FONT_B; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText(sym, cx - 32, cy + 0.5);
  }
  function regelMalOben(x, R, zeit) {
    if (R.regel === "dunkel") dunkelMalen(x, R, zeit);
    else if (R.regel === "goblindieb" && R.dieb) {
      const D = R.dieb;
      x.save(); x.translate(D.x, D.y); if (!D.links) x.scale(-1, 1);
      const lauf = Math.sin(D.ph * 16);
      x.strokeStyle = "#3a2d20"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-2, 4); x.lineTo(-4 + lauf * 3, 11); x.moveTo(2, 4); x.lineTo(4 - lauf * 3, 11); x.stroke();
      x.fillStyle = "#7a5a37"; oval(x, 0, 0, 6, 7);
      x.fillStyle = "#6b7d3e"; x.beginPath(); x.moveTo(-3, -9); x.lineTo(-12, -14); x.lineTo(-4, -6); x.fill(); x.beginPath(); x.moveTo(3, -9); x.lineTo(10, -15); x.lineTo(4, -6); x.fill();
      x.fillStyle = "#8a9b4c"; kreis(x, 0, -8, 5); x.beginPath(); x.moveTo(-4, -8); x.lineTo(-10, -5); x.lineTo(-4, -5); x.fill();
      x.fillStyle = "#ffd34d"; kreis(x, -2, -9, 1);
      x.restore();
      if (D.item) malDing(x, D.item, zeit);
    } else if (R.regel === "laterne") {
      R.wachen.forEach(w => {
        const g = x.createRadialGradient(w.x, w.y, 4, w.x, w.y, w.r);
        g.addColorStop(0, w.alarm > 0 ? "rgba(255,90,60,.5)" : "rgba(255,200,110,.42)"); g.addColorStop(0.7, w.alarm > 0 ? "rgba(255,90,60,.18)" : "rgba(255,190,90,.14)"); g.addColorStop(1, "rgba(255,190,90,0)");
        x.fillStyle = g; x.beginPath(); x.arc(w.x, w.y, w.r, 0, Math.PI * 2); x.fill();
        x.strokeStyle = "rgba(255,200,110,.25)"; x.setLineDash([3, 4]); x.beginPath(); x.arc(w.x, w.y, w.r, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
        x.save(); x.translate(w.x + (w.v > 0 ? -10 : 10), w.y + 4); if (w.v < 0) x.scale(-1, 1);
        x.fillStyle = "#7a2f26"; x.beginPath(); x.moveTo(-6, -8); x.lineTo(6, -8); x.lineTo(8, 12); x.lineTo(-8, 12); x.closePath(); x.fill();
        x.fillStyle = "#5a1f1a"; kreis(x, 0, -11, 5.5); x.fillStyle = "#c9a88a"; oval(x, 1.5, -10, 2.4, 2.8);
        x.strokeStyle = "#3a2d20"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(5, -2); x.lineTo(10, -5); x.stroke();
        x.restore();
        x.save(); x.shadowColor = "#ffcf7a"; x.shadowBlur = 12; x.fillStyle = "#ffe0a0"; x.fillRect(w.x - 2.5, w.y - 3, 5, 7); x.restore();
        x.strokeStyle = "#3a2d20"; x.lineWidth = 1; x.strokeRect(w.x - 2.5, w.y - 3, 5, 7);
      });
    } else if (R.regel === "venomfang" && R.drache.giftT > 0) {
      const D = R.drache, a = Math.min(1, R.drache.giftT / 0.6);
      for (let i = 0; i < 9; i++) { const w = i / 9 * Math.PI * 2 + zeit * 0.6, rr = 60 + Math.sin(zeit * 2 + i) * 10; x.fillStyle = "rgba(120,190,70," + 0.16 * a + ")"; kreis(x, D.x + Math.cos(w) * rr * 0.7, D.y - 50 + Math.sin(w) * rr * 0.6, 34); }
      x.strokeStyle = "rgba(138,194,74," + 0.6 * a + ")"; x.setLineDash([4, 4]); x.beginPath(); x.arc(D.x, D.y - 50, 100, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    } else if (R.regel === "geysir") {
      R.geysire.forEach(g => {
        if (g.t < g.warn) {
          const u = g.t / g.warn, fl = 0.4 + Math.sin(zeit * 20) * 0.2;
          x.fillStyle = "rgba(255,110,40," + (0.25 + u * 0.4) * fl * 2 + ")"; oval(x, g.x, LEISTE - 6, g.w * 0.6, 5);
          x.strokeStyle = "rgba(255,138,58," + (0.2 + u * 0.5) + ")"; x.setLineDash([4, 6]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(g.x - g.w / 2, LEISTE); x.lineTo(g.x - g.w / 2, 110); x.moveTo(g.x + g.w / 2, LEISTE); x.lineTo(g.x + g.w / 2, 110); x.stroke(); x.setLineDash([]);
          x.font = "16px " + FONT_B; x.textAlign = "center"; x.fillText("⚠️", g.x, LEISTE - 22);
        } else {
          const u = (g.t - g.warn) / g.aus, hoch = Math.min(1, u * 4) * (LEISTE - 110), a = u > 0.8 ? (1 - u) / 0.2 : 1;
          const gr = x.createLinearGradient(0, LEISTE - hoch, 0, LEISTE); gr.addColorStop(0, "rgba(255,210,120," + a + ")"); gr.addColorStop(0.5, "rgba(255,120,40," + a + ")"); gr.addColorStop(1, "rgba(180,50,20," + a + ")");
          x.fillStyle = gr; x.beginPath(); x.moveTo(g.x - g.w / 2, LEISTE); x.quadraticCurveTo(g.x - g.w * 0.3, LEISTE - hoch * 0.5, g.x - g.w * 0.2, LEISTE - hoch); x.lineTo(g.x + g.w * 0.2, LEISTE - hoch); x.quadraticCurveTo(g.x + g.w * 0.3, LEISTE - hoch * 0.5, g.x + g.w / 2, LEISTE); x.fill();
          if (Math.random() < 0.6) S.teilchen.push({ x: g.x + zw(-12, 12), y: LEISTE - hoch * Math.random(), vx: zw(-40, 40), vy: zw(-120, -40), t: 0, dauer: 0.6, farbe: zufall(["#ff8a3a", "#ffd34d", "#c4564a"]), gr: 3 });
        }
      });
    }
  }

  function raubzugEnde() {
    const R = S.R; if (R.fertig) return;
    R.fertig = true;
    S.schaetzeGesamt += R.schaetze;
    erfolg("erster");
    if (R.beute >= 1000) erfolg("beute1000");
    if (R.gier >= 5) erfolg("gier5");
    nachRaubZeigen();
  }

  /* ================== PHASE 2: DER ZORN DES HAINS ================== */
  const PFADE = [
    [[60, 24], [60, 118], [328, 118], [328, 226], [78, 226], [78, 326], [200, 326], [200, 396]],
    [[340, 24], [340, 104], [90, 150], [90, 252], [312, 282], [312, 352], [200, 362], [200, 396]],
    [[200, 24], [200, 86], [68, 136], [68, 238], [200, 270], [332, 300], [332, 368], [200, 396]],
    [[96, 24], [96, 90], [304, 90], [304, 176], [96, 176], [96, 268], [304, 268], [304, 350], [200, 396]]
  ];

  function pfadBauen(lv) {
    /* jedes Gebiet hat seine feste Karte, damit der Garten über alle drei Level stehen bleiben kann */
    const g = gebietVon(lv);
    let roh = PFADE[g % PFADE.length];
    if (Math.floor(g / PFADE.length) % 2 === 1) roh = roh.map(([x, y]) => [W - x, y]);
    // Ecken etwas abrunden: jede Ecke durch eine kurze Kurve ersetzen
    const p = [];
    for (let i = 0; i < roh.length; i++) {
      const [x, y] = roh[i];
      if (i === 0 || i === roh.length - 1) { p.push({ x, y }); continue; }
      const [ax, ay] = roh[i - 1], [bx, by] = roh[i + 1];
      const la = abst(x, y, ax, ay), lb = abst(x, y, bx, by), r = Math.min(26, la / 2, lb / 2);
      const s = { x: x + (ax - x) / la * r, y: y + (ay - y) / la * r }, e = { x: x + (bx - x) / lb * r, y: y + (by - y) / lb * r };
      for (let k = 0; k <= 6; k++) {
        const u = k / 6, v = 1 - u;
        p.push({ x: v * v * s.x + 2 * v * u * x + u * u * e.x, y: v * v * s.y + 2 * v * u * y + u * u * e.y });
      }
    }
    p.push({ x: HORT.x, y: HORT.y - 6 });
    const lang = [0];
    for (let i = 1; i < p.length; i++) lang.push(lang[i - 1] + abst(p[i].x, p[i].y, p[i - 1].x, p[i - 1].y));
    return { p, lang, gesamt: lang[lang.length - 1] };
  }
  function pfadPunkt(P, s) {
    if (s <= 0) return { x: P.p[0].x, y: P.p[0].y };
    if (s >= P.gesamt) { const q = P.p[P.p.length - 1]; return { x: q.x, y: q.y }; }
    let i = 1; while (P.lang[i] < s) i++;
    const a = P.p[i - 1], b = P.p[i], u = (s - P.lang[i - 1]) / (P.lang[i] - P.lang[i - 1]);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, w: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  function abstZumPfad(P, x, y) {
    let m = 1e9;
    for (let i = 1; i < P.p.length; i++) {
      const a = P.p[i - 1], b = P.p[i], dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
      const u = klemm(((x - a.x) * dx + (y - a.y) * dy) / l2, 0, 1);
      m = Math.min(m, abst(x, y, a.x + dx * u, a.y + dy * u));
    }
    return m;
  }
  /* Position am Weg (0 = Eingang, 1 = Hort) */
  function pfadU(P, x, y) {
    let best = 0, bd = 1e9;
    for (let s = 0; s <= P.gesamt; s += 6) { const q = pfadPunkt(P, s), d = abst(q.x, q.y, x, y); if (d < bd) { bd = d; best = s; } }
    return best / P.gesamt;
  }
  /* liegt der Punkt in der Schneise, durch die Flieger vom Eingang zum Hort fliegen? */
  function flugSchneise(P, y) {
    const st = P.p[0], u = klemm((y - 20) / (HORT.y - 30), 0, 1);
    const l = Math.max(30, st.x - 120), rr = Math.min(W - 30, st.x + 120);
    return { links: l + (HORT.x - l) * u, rechts: rr + (HORT.x - rr) * u };
  }
  function inFlugschneise(P, x, y, rand) { if (y < 20 || y > HORT.y) return false; const f = flugSchneise(P, y); return x >= f.links - rand && x <= f.rechts + rand; }
  function plaetzeBauen(P) {
    const l = [];
    let seite = 1;
    for (let s = 30; s < P.gesamt - 26; s += 22) {
      const a = pfadPunkt(P, s), b = pfadPunkt(P, s + 4), w = Math.atan2(b.y - a.y, b.x - a.x);
      for (const sd of [seite, -seite]) {
        const x = a.x + Math.cos(w + Math.PI / 2) * 39 * sd, y = a.y + Math.sin(w + Math.PI / 2) * 39 * sd;
        if (x < 22 || x > W - 22 || y < 46 || y > LEISTE - 24) continue;
        if (abstZumPfad(P, x, y) < 31) continue;
        if (abst(x, y, HORT.x, HORT.y) < 50) continue;
        if (l.some(q => abst(q.x, q.y, x, y) < 44)) continue;
        l.push({ x, y, turm: null }); seite = -seite; break;
      }
    }
    /* Reihenfolge der ersten zwölf bleibt wie früher, damit gespeicherte Gärten an ihrem Platz bleiben */
    const alt = l.filter((q, i) => i % 4 !== 3), basis = alt.slice(0, 12), mehr = l.filter(q => !basis.includes(q));
    const frei = (x, y, abstand) => x >= 22 && x <= W - 22 && y >= 46 && y <= LEISTE - 24 && abstZumPfad(P, x, y) >= 31 && abst(x, y, HORT.x, HORT.y) >= 50 && basis.every(q => abst(q.x, q.y, x, y) >= abstand);
    // weitere Plätze direkt am Weg
    mehr.forEach(q => { if (frei(q.x, q.y, 40)) basis.push(q); });
    // Luftwachen: Plätze an der Flugschneise vom Eingang zum Hort, wo fliegende Gegner entlangkommen
    const st = P.p[0], kand = [];
    for (let y = 60; y <= LEISTE - 30; y += 12) for (let x = 30; x <= W - 30; x += 12) {
      const u = klemm((y - 20) / (HORT.y - 30), 0, 1), mx = st.x + (HORT.x - st.x) * u, breite = 120 * (1 - u) + 20;
      const d = Math.abs(x - mx);
      if (d > breite + 30) continue;
      kand.push({ x, y, wert: d / (breite + 30) + Math.abs(u - 0.62) * 0.8 });
    }
    kand.sort((a, b) => a.wert - b.wert || a.y - b.y || a.x - b.x);
    let luft = 0;
    for (const k of kand) { if (luft >= 6) break; if (frei(k.x, k.y, 46)) { basis.push({ x: k.x, y: k.y, turm: null, luft: true }); luft++; } }
    return basis;
  }

  const WELLEN = 3;
  function gegnerListe(lv, gier) {
    const g = gebietVon(lv), G = GEB[g], innen = innenVon(lv), boss = istBossLevel(lv);
    const typ = () => { let r = Math.random(); for (const [k, w] of G.gegner) { r -= w; if (r <= 0) return k; } return G.gegner[0][0]; };
    const wellen = [], endlos = lv >= KAMPAGNE;
    let rohS = 0, nS = 0;
    for (let w = 0; w < WELLEN; w++) {
      const roh = Math.min(50, Math.round((7 + lv * 0.85 + innen * 1.5 + w * 3 + gier * 1.5) * mod("anzahl")));
      /* Endlos: weniger, dafür zähere Gegner – gleiche Gesamtstärke, aber zügigere Wellen */
      const n = endlos ? Math.min(18, roh) : roh;
      const l = [];
      for (let i = 0; i < n; i++) l.push(typ());
      let ex = 0;
      if (endlos && w > 0) { const exRoh = Math.min(8, 2 + (lv - KAMPAGNE)); ex = Math.min(4, exRoh); rohS += exRoh; for (let i = 0; i < ex; i++) l.push(zufall(GEB[Math.floor(Math.random() * GEBIETE_ANZAHL)].gegner)[0]); mischen(l); }
      rohS += roh; nS += n + ex;
      wellen.push(l);
    }
    const hpBonus = endlos ? Math.max(1, rohS / Math.max(1, nS)) : 1;
    if (boss) {
      const bk = lv < KAMPAGNE ? G.boss : zufall(GEB.map(G => G.boss).filter(b => !FEINDE[b].unbesiegbar));
      if (bk === "demogorgon") { wellen[WELLEN - 1] = []; return { wellen, boss: bk, demo: true, liste: wellen.flat(), hpBonus }; }
      wellen[WELLEN - 1].splice(Math.floor(wellen[WELLEN - 1].length * 0.5), 0, bk);
      return { wellen, boss: bk, liste: wellen.flat(), hpBonus };
    }
    return { wellen, liste: wellen.flat(), hpBonus };
  }

  function abwehrStarten() {
    const R = S.R, lv = S.lv, g = gebietVon(lv);
    musikStart(GEB[g].musik, 1); musikWechsel(1);
    const P = pfadBauen(lv);
    const gl = R.gl || gegnerListe(lv, R.gier);
    const reserve = 20 + 30 * up("notgroschen") + (hat("schatzwacht") ? 60 : 0);
    S.phase = "abwehr";
    S.texte = []; S.teilchen = []; S.banner = null; S.blitze = []; S.quip = null; S.quipT = 0;
    S.A = {
      g, P, plaetze: plaetzeBauen(P), feinde: [], geschosse: [], effekte: [],
      hort: R.beute + reserve, reserve, hortStart: R.beute + reserve,
      saat: (S.einzel ? (S.garten && S.garten.setzlinge.length ? 60 + 10 * lv : 110 + 40 * lv) : 30) + 12 * up("ernte") + 15 * tal("boden") + R.saat, zorn: 0, zauber: zauberWahlPruefen().map(k => ({ k, cd: 0, max: ZAUBER[k].cd * Math.pow(0.85, up("funken")) * Math.pow(0.92, tal("mondsegen")) * mod("zauberCd") })), aktiv: 0, mond: null, adler: null,
      wellen: gl.wellen, welle: -1, warte: [], boss: gl.boss || null, bossDa: false, ansturm: [], fallen: [], auraT: 0, demo: !!gl.demo, demoT: 0, demoDauer: 62, demoWeg: false,
      spawnT: 0, abstand: lv >= KAMPAGNE ? 0.55 : Math.max(0.42, 1.4 - lv * 0.035), gespawnt: 0, hpBonus: gl.hpBonus || 1, licht: [], teiche: [],
      vorT: 12, wahl: -1, baer: null, erlegt: 0, verlorenGold: 0, zurueckGold: 0, schnell: klemm(parseInt(lies("imres-echohort-schnell", "1"), 10) || 1, 1, 3), pauseNr: 0, blitzT: 5, rng: S.tag ? lcg(tagSaat(S.tag) + 77) : null, zinsGesamt: 0,
      helfer: [], helferT: zw(12, 18) * [1, 0.72, 0.5][up("freunde")], barradinT: 0, portrait: null, letzterHelfer: "", punkte: 0, gesamt: gl.liste.length + (gl.demo ? 1 : 0), lv, fertig: false, endeT: 0, bossGerufen: false
    };
    if (S.A.demo) S.A.gesamt = gl.liste.length;
    S.A.plaetze.forEach(p => { p.u = pfadU(P, p.x, p.y); p.luftNah = inFlugschneise(P, p.x, p.y, 46); });
    if (!S.einzel && S.erspart > 0) { S.A.saat += S.erspart; S.A.ersparnisStart = S.erspart; S.erspart = 0; }
    gartenVorbereiten(g, S.A.plaetze);
    /* leerer Garten (neue Welt oder neues Spiel): kein Countdown, erst losgehen, wenn Echo bereit ist */
    S.A.halt = !S.A.plaetze.some(p => p.turm);
    S.A.bauTab = S.garten.setzlinge.length ? "setz" : "waechter";
    hintergrundAbwehr(g, P);
  }

  function feindNeu(typ, s, elite) {
    const A = S.A, d = FEINDE[typ], lv = S.lv;
    const hpF = (d.boss ? 1 + 0.09 * lv + 0.004 * lv * lv : skalierung(lv) * (A.hpBonus || 1)) * STUFEN[S.stufe].hp * (1 + 0.07 * Math.max(0, A.welle)) * mod("feindHp");
    const e = {
      typ, d, hp: d.hp * hpF, max: d.hp * hpF, v: d.v * STUFEN[S.stufe].tempo * (1 + Math.min(0.4, lv * 0.012)) * mod("feindTempo") * (d.flug ? mod("flugTempo") : 1), r: d.r,
      s: s || 0, x: 0, y: 0, flug: !!d.flug, bremse: 1, bremsT: 0, festT: 0, gift: 0, giftT: 0,
      cd: 3 + Math.random() * 2, unsT: 0, unsichtbarZyklus: Math.random() * 4, ph: Math.random() * 6, treffT: 0, verwandelt: false, tot: false
    };
    if (e.flug) {
      const st = pfadPunkt(A.P, 0);
      e.x = klemm(st.x + zw(-120, 120), 30, W - 30); e.y = 20;
    } else { const q = pfadPunkt(A.P, e.s); e.x = q.x; e.y = q.y; }
    if (d.unbesiegbar) e.v = A.P.gesamt / 58 * STUFEN[S.stufe].tempo;
    if (elite && ELITE[elite] && !d.boss && !d.unbesiegbar) {
      const E = ELITE[elite]; e.elite = elite;
      e.hp *= E.hp; e.max = e.hp; if (E.v) e.v *= E.v; if (E.schild) { e.schild = e.max * E.schild; e.schildMax = e.schild; }
      text(e.x, Math.max(52, e.y + 22), E.sym + " " + t().elite, E.farbe, 12, 1.2);
    }
    if (d.boss) {
      text(W / 2, 180, t().bossRuft[typ] || "", "#c4564a", 22, 2.2);
      banner(t().bossRuft[typ] || "", "#c4564a", 2.2);
      KLANG.boss(); quip("boss", 1); vib([80, 60, 120]); musikLage(3);
      if (typ === "demogorgon") { A.demoT = 0; text(W / 2, 220, t().demo.text, "#ebe2cc", 14, 4); }
    }
    A.feinde.push(e);
    return e;
  }

  function abwehrUpdate(dt) {
    const A = S.A;
    if (S.quipT > 0) S.quipT -= dt;
    ambientUpdate(A, dt);
    A.zauber.forEach(z => { z.cd = Math.max(0, z.cd - dt); });
    zauberUpdate(dt);
    A.zorn = Math.max(0, A.zorn - dt * 1.2);
    if (A.fertig) { A.endeT += dt; if (A.endeT > 1.1 && zustand === "spiel") ergebnisZeigen(); return; }
    // Vorbereitung
    if (A.vorT > 0 && !A.halt) { A.vorT -= dt; if (A.vorT <= 0) welleStarten(); }
    else {
      // Gegner kommen
      A.spawnT -= dt;
      if (A.warte.length && A.spawnT <= 0) {
        const typ = A.warte.shift(), wurf = A.rng || Math.random;
        const chance = S.lv < 3 ? 0 : Math.min(0.16, 0.03 + 0.004 * S.lv) * mod("elite");
        const ew = wurf() < chance ? ELITE_REIHE[Math.floor(wurf() * ELITE_REIHE.length)] : null;
        feindNeu(typ, 0, ew);
        A.gespawnt++;
        A.spawnT = A.abstand * (A.gespawnt % 8 === 0 ? 2.6 : 1) * zw(0.75, 1.25);
      }
      if (A.demo && A.welle === A.wellen.length - 1) {
        A.demoT += dt;
        if (!A.bossGerufen && A.demoT > 2) { A.bossGerufen = true; feindNeu("demogorgon"); }
        if (A.demoT < A.demoDauer && A.warte.length < 2 && Math.random() < dt / 2.6) A.warte.push("kuotoa");
        if (A.demoT >= A.demoDauer && !A.demoWeg) {
          A.demoWeg = true; A.warte = [];
          const dm = A.feinde.find(e => e.typ === "demogorgon");
          if (dm) { dm.tot = true; funken(dm.x, dm.y, 40, ["#4aa0b0", "#9fd6ec", "#ebe2cc"], 120, 3); }
          banner(t().demo.weg, "#9fd6ec", 2.4); KLANG.puff();
        }
      }
    }
    // Gewitter: ab und zu schlägt ein Blitz in einen Plünderer
    if (launeVon() && LAUNEN[launeVon()].blitzschlag && A.vorT <= 0 && A.feinde.length) {
      A.blitzT -= dt;
      if (A.blitzT <= 0) {
        A.blitzT = zw(5, 8);
        const z = zufall(A.feinde.filter(e => sichtbarFuer(e) && !e.d.unbesiegbar).concat([null]));
        if (z) { S.blitze.push({ art: "blitz", x1: z.x + zw(-30, 30), y1: 30, x2: z.x, y2: z.y, t: 0, dauer: 0.35, seed: Math.random(), dick: true }); treffen(z, 70 * turmSk(), "kette"); funken(z.x, z.y, 10, ["#f3e27a", "#ffffff"], 80, 2); KLANG.blitz(); }
      }
    }
    // Tiere: Auren und Bären am Weg
    aurenBerechnen(A); baerenVorbereiten(A);
    // Gegner bewegen
    A.feinde.forEach(e => feindBewegen(e, dt));
    A.feinde = A.feinde.filter(e => !e.tot);
    // Wächter
    A.plaetze.forEach(p => { if (p.turm) turmUpdate(p, dt); });
    tiereUpdate(A, dt);
    // Geschosse
    A.geschosse.forEach(g => {
      g.t += dt;
      if (g.art === "dorn") {
        const z = g.ziel;
        if (!z || z.tot) { g.weg = true; return; }
        const dx = z.x - g.x, dy = z.y - g.y, d = Math.hypot(dx, dy), sch = 340 * dt;
        if (d <= sch + z.r) { treffen(z, g.schaden, "schuss"); if (g.gift && !z.tot) { z.gift = Math.max(z.gift, g.gift); z.giftT = 3; } g.weg = true; return; }
        g.x += dx / d * sch; g.y += dy / d * sch; g.w = Math.atan2(dy, dx);
      } else if (g.art === "splitter") {
        const z = g.ziel;
        if (!z || z.tot) { g.weg = true; funken(g.x, g.y, 3, ["#cfeaf4", "#ffffff"], 40, 1.5); return; }
        const dx = z.x - g.x, dy = z.y - g.y, d = Math.hypot(dx, dy), sch = 420 * dt;
        if (d <= sch + z.r) {
          z.eisT = Math.max(z.eisT || 0, g.bremsT);
          treffen(z, g.schaden, "frost");
          if (!z.tot) { z.bremse = Math.min(z.bremse, g.bremse); z.bremsT = Math.max(z.bremsT, g.bremsT); if (g.frost) { if (z.d.boss) z.bremse = Math.min(z.bremse, 0.35); else festhalten(z, 0.9); } }
          if (g.teilen) S.A.feinde.filter(o => o !== z && !o.tot && abst(o.x, o.y, z.x, z.y) < 70).sort((a, b) => abst(a.x, a.y, z.x, z.y) - abst(b.x, b.y, z.x, z.y)).slice(0, 2)
            .forEach(o => S.A.geschosse.push({ art: "splitter", x: z.x, y: z.y, ziel: o, schaden: g.schaden * 0.5, bremse: g.bremse, bremsT: g.bremsT, t: 0, w: 0, dreh: 0 }));
          funken(z.x, z.y, 5, ["#cfeaf4", "#9fd6ec", "#ffffff"], 60, 2); g.weg = true; return;
        }
        g.x += dx / d * sch; g.y += dy / d * sch; g.w = Math.atan2(dy, dx); g.dreh = (g.dreh || 0) + dt * 14;
      } else if (g.art === "spore") {
        const u = Math.min(1, g.t / g.dauer);
        g.x = g.x0 + (g.x1 - g.x0) * u; g.y = g.y0 + (g.y1 - g.y0) * u - Math.sin(u * Math.PI) * 34;
        if (u >= 1) {
          g.weg = true;
          const r = g.r || 28;
          imKreis(g.x1, g.y1, r).forEach(e => { e.gift = Math.max(e.gift, g.schaden); e.giftT = 3; if (g.seuche) e.seuche = true; if (g.bremst) { e.bremse = Math.min(e.bremse, 0.6); e.bremsT = Math.max(e.bremsT, 3); } });
          S.blitze.push({ art: "sporenwolke", x: g.x1, y: g.y1, r, t: 0, dauer: 0.9 });
          KLANG.sporen();
        }
      } else if (g.art === "wolf") {
        const heim = g.heim, v = 290 * dt;
        if (g.zustand === "hin") {
          let z = g.ziel;
          if (!z || z.tot || z.flug) { z = g.ziel = imKreis(heim.x, heim.y, g.reich + 20).filter(e => !e.flug).sort((a, b) => abst(g.x, g.y, a.x, a.y) - abst(g.x, g.y, b.x, b.y))[0]; }
          if (!z) { g.zustand = "zurueck"; return; }
          const dx = z.x - g.x, dy = z.y - g.y, d = Math.hypot(dx, dy);
          g.links = dx < 0;
          if (d <= v + z.r + 4) {
            const doppelt = z.wurzelT > 0;
            treffen(z, g.schaden * (doppelt ? 2 : 1), "biss");
            if (g.alpha && !z.tot && !z.d.boss) festhalten(z, 0.8);
            if (doppelt) kombo(z);
            S.blitze.push({ art: "biss", x: z.x, y: z.y, t: 0, dauer: 0.35 });
            KLANG.biss(); g.zustand = "zurueck"; return;
          }
          g.x += dx / d * v; g.y += dy / d * v;
        } else {
          const dx = heim.x - g.x, dy = heim.y - g.y, d = Math.hypot(dx, dy);
          g.links = dx < 0;
          if (d <= v) { g.weg = true; if (g.turm) g.turm.draussen = Math.max(0, (g.turm.draussen || 0) - 1); return; }
          g.x += dx / d * v; g.y += dy / d * v;
        }
      } else if (g.art === "falke") {
        const v = 400 * dt;
        if (g.zustand === "hin") {
          const z = g.ziel;
          if (!z || z.tot) { g.zustand = "zurueck"; return; }
          const dx = z.x - g.x, dy = z.y - g.y, d = Math.hypot(dx, dy);
          g.w = Math.atan2(dy, dx);
          if (d <= v + z.r) {
            if (z.beute) goldZurueck(z);
            treffen(z, g.schaden * (z.flug ? 2 : 1), "falke");
            funken(z.x, z.y, 8, ["#9fb6c8", "#ebe2cc"], 80); KLANG.biss(); g.zustand = "zurueck"; return;
          }
          g.x += dx / d * v; g.y += dy / d * v;
        } else {
          const dx = g.heim.x - g.x, dy = g.heim.y - g.y, d = Math.hypot(dx, dy);
          g.w = Math.atan2(dy, dx);
          if (d <= v) { g.weg = true; g.turm.unterwegs = false; return; }
          g.x += dx / d * v; g.y += dy / d * v;
        }
      } else if (g.art === "gold") {
        const u = Math.min(1, g.t / g.dauer);
        g.x = g.x0 + (g.x1 - g.x0) * u; g.y = g.y0 + (g.y1 - g.y0) * u - Math.sin(u * Math.PI) * 60;
        if (u >= 1) { g.weg = true; S.A.hort += g.n; S.A.zurueckGold += g.n; funken(HORT.x, HORT.y - 10, 12, ["#ffd34d", "#e0a046", "#fff0a0"], 90); KLANG.gold(); }
      } else if (g.art === "feuerball") {
        const u = Math.min(1, g.t / g.dauer);
        g.x = g.x0 + (g.x1 - g.x0) * u; g.y = g.y0 + (g.y1 - g.y0) * u - Math.sin(u * Math.PI) * 50;
        if (u >= 1) { explosion(g.x1, g.y1, g.r, g.schaden); g.weg = true; }
      } else if (g.art === "fels") {
        const u = Math.min(1, g.t / g.dauer);
        g.x = g.x0 + (g.x1 - g.x0) * u; g.y = g.y0 + (g.y1 - g.y0) * u - Math.sin(u * Math.PI) * 70;
        if (u >= 1) { g.weg = true; turmBeschaedigen(g.platz, true); funken(g.x1, g.y1, 16, ["#7a7468", "#a8a090"], 110); KLANG.stein(); S.beben = 0.25; }
      }
    });
    A.geschosse = A.geschosse.filter(g => !g.weg);
    // Bär
    if (A.baer) baerUpdate(dt);
    // Freunde der Gruppe
    if (A.vorT <= 0) helferUpdate(dt);
    // Ende?
    const unterwegs = A.feinde.some(e => e.beute > 0 && !e.tot) || A.geschosse.some(g => g.art === "gold");
    if (A.hort <= 0 && !unterwegs) { A.hort = 0; A.fertig = true; A.verloren = true; A.endeT = 0; return; }
    if (unterwegs) return;
    const letzte = A.welle >= A.wellen.length - 1;
    if (A.vorT <= 0 && !A.warte.length && !A.feinde.length && (!A.demo || !letzte || A.demoWeg)) {
      if (letzte) { A.fertig = true; A.verloren = false; A.endeT = 0; KLANG.sieg(); banner(t().sicher, "#e0a046", 2); }
      else { A.vorT = 9; const b = 4 + 3 * (A.welle + 1), z = zinsen(A.saat); A.saat += b + z; A.zinsGesamt += z; banner(t().welleGeschafft, "#cfe6a8", 1.6); musikLage(1); musikSignal("geschafft"); text(W / 2, 260, "+" + b + " 🌱", "#cfe6a8", 18, 1.6); if (z > 0) text(W / 2, 284, t().zinsen(z), "#ffd34d", 14, 2); KLANG.kaufen(); }
    }
  }
  function welleStarten() {
    const A = S.A;
    A.vorT = 0; A.welle++; A.halt = false; A.pauseNr++; A.letzterTipp = null;
    A.plaetze.forEach(p => { if (p.turm) { p.turm.frisch = 0; p.turm.ausBeutel = null; } });
    A.warte = A.wellen[A.welle].slice(); A.spawnT = 0.3; A.gespawnt = 0;
    banner(t().welle(A.welle + 1, A.wellen.length), "#e0a046", 1.4); KLANG.boss(); if (MZ.lage < 3) musikLage(2); musikSignal("welle");
    if (A.demo && A.welle === A.wellen.length - 1) { A.demoT = 0; A.bossGerufen = false; }
  }
  function welleRufen() {
    const A = S.A; if (A.vorT <= 0 || A.fertig) return;
    const n = Math.ceil(A.vorT) * 2; A.saat += n;
    text(W / 2, 300, "+" + n + " 🌱", "#cfe6a8", 16); welleStarten();
  }

  function feindBewegen(e, dt) {
    const A = S.A, d = e.d;
    e.ph += dt; e.treffT = Math.max(0, e.treffT - dt);
    if (e.bremsT > 0) { e.bremsT -= dt; if (e.bremsT <= 0) e.bremse = 1; }
    if (e.giftT > 0) { e.giftT -= dt; treffen(e, e.gift * dt, "gift", true); if (e.tot) return; }
    if (e.elite === "heilung" && e.hp < e.max) e.hp = Math.min(e.max, e.hp + e.max * 0.035 * dt);
    // Fähigkeiten
    e.cd -= dt;
    if (e.enthuelltT > 0) e.enthuelltT -= dt;
    if (e.eisT > 0) e.eisT -= dt;
    if (e.wurzelT > 0) e.wurzelT -= dt;
    if (e.bruchT > 0) e.bruchT -= dt;
    if (e.festSperre > 0) e.festSperre -= dt;
    if (e.markT > 0) e.markT -= dt;
    if (d.unsichtbar) { e.unsichtbarZyklus += dt; e.unsT = (e.unsichtbarZyklus % 5.5) > 3.7 && !(e.enthuelltT > 0) ? 1 : 0; }
    if (e.cd <= 0) {
      if (d.ruft) { e.cd = 6; for (let i = 0; i < 2; i++) { const n = feindNeu(d.ruft, Math.max(0, e.s - 10 - i * 14)); A.gesamt++; n.v *= 1.1; } funken(e.x, e.y, 10, ["#6b7d3e", "#ebe2cc"], 60); }
      else if (d.blinzeln) { e.cd = 5; funken(e.x, e.y, 14, ["#8a6ad0", "#c49ae0"], 70); e.s = e.flieht ? Math.max(5, e.s - 55) : Math.min(A.P.gesamt - 30, e.s + 55); if (!A.blinzelText) { A.blinzelText = true; text(e.x, e.y - 24, t().geheimgang, "#c49ae0", 15); } KLANG.puff(); }
      else if (d.gift) { e.cd = 7; giftAtem(e); }
      else if (d.schrei) { e.cd = 10; A.plaetze.forEach(p => { if (p.turm) p.turm.ausT = Math.max(p.turm.ausT, 2.5); }); banner(t().demo.schrei, "#c4564a", 1.6); KLANG.schrei(); S.beben = 0.5; }
      else if (d.wurf) { e.cd = 6.5; const ziele = A.plaetze.filter(p => p.turm); if (ziele.length) { const z = zufall(ziele); A.geschosse.push({ art: "fels", x0: e.x, y0: e.y, x1: z.x, y1: z.y, x: e.x, y: e.y, t: 0, dauer: 0.9, platz: z }); text(e.x, e.y - 30, t().wurf, "#ebe2cc", 14); } }
      else if (d.netz) { e.cd = 6; const z = A.plaetze.filter(p => p.turm && abst(p.x, p.y, e.x, e.y) < 50); if (z.length) { const p = zufall(z); p.turm.ausT = Math.max(p.turm.ausT, 2.6); p.turm.netz = 2.6; text(p.x, p.y - 20, t().netzTreffer, "#ebe2cc", 12); } }
      else e.cd = 99;
    }
    if (d.verwandeln && !e.verwandelt && e.hp < e.max * 0.5) {
      e.verwandelt = true; e.flug = true; e.v *= 2.1; e.r = 8; funken(e.x, e.y, 20, ["#4a3a66", "#c49ae0"], 90);
      text(e.x, e.y - 24, t().neznaFlieht, "#c49ae0", 15); KLANG.puff();
    }
    // Bewegung
    let v = e.v * e.bremse;
    if (e.halt) v = 0; else if (e.baerBremse) v *= 0.5;
    if (e.festT > 0) { e.festT -= dt; v = d.boss ? v * 0.5 : 0; }
    if (d.unbesiegbar) v = Math.max(v, e.v * 0.35);
    if (e.flieht) {
      const aus = A.P.p[0];
      if (e.flug) {
        const dx = aus.x - e.x, dy = aus.y - 14 - e.y, l = Math.hypot(dx, dy);
        if (l < 16) { entkommen(e); return; }
        e.x += dx / l * v * dt; e.y += dy / l * v * dt;
      } else {
        e.s -= v * dt;
        if (e.s <= 0) { entkommen(e); return; }
        const q = pfadPunkt(A.P, e.s); e.x = q.x; e.y = q.y;
      }
    } else if (e.wartet) {
      if (A.hort > 0) ankommen(e);
    } else if (e.flug) {
      const dx = HORT.x - e.x, dy = HORT.y - 10 - e.y, l = Math.hypot(dx, dy);
      if (l < 16) { ankommen(e); return; }
      e.x += dx / l * v * dt; e.y += dy / l * v * dt;
    } else {
      e.s += v * dt;
      if (e.s >= A.P.gesamt) { ankommen(e); return; }
      const q = pfadPunkt(A.P, e.s); e.x = q.x; e.y = q.y;
    }
  }

  function ankommen(e) {
    const A = S.A;
    const k = Math.min(A.hort, Math.round(Math.max(e.d.klau * (1 + 0.04 * Math.min(S.lv, KAMPAGNE)), A.hortStart * (e.d.boss ? 0.22 : 0.045))));
    A.hort -= k;
    if (k <= 0 && !e.d.unbesiegbar) { if (!e.wartet) { e.wartet = true; text(e.x, e.y - 18, t().leer, "#a89f8f", 12); } return; }
    e.wartet = false;
    if (e.d.unbesiegbar) e.tot = true;
    else { e.flieht = true; e.beute = k; e.v *= 1.25; e.bremse = 1; e.festT = 0; }
    text(HORT.x + zw(-30, 30), HORT.y - 30, t().klaut(k), "#c4564a", 16);
    funken(HORT.x, HORT.y - 6, 10, ["#e0a046", "#ffd34d"], 90);
    KLANG.klau(); vib(35);
    A.zorn = klemm(A.zorn + Math.min(40, k * 0.6) * zornFaktor(), 0, 100);
    if (A.zorn >= 100) ausbruchAbwehr();
  }

  function entkommen(e) {
    const A = S.A; e.tot = true;
    if (e.beute > 0) { A.verlorenGold += e.beute; text(klemm(e.x, 70, W - 70), Math.max(46, e.y + 20), t().entkommt(e.beute), "#c4564a", 15, 1.8); KLANG.klau(); }
    e.beute = 0;
  }
  function goldZurueck(e) {
    const A = S.A, n = e.beute; if (!n) return;
    e.beute = 0;
    A.geschosse.push({ art: "gold", x0: e.x, y0: e.y, x1: HORT.x, y1: HORT.y - 8, x: e.x, y: e.y, t: 0, dauer: 0.75, n });
    text(e.x, e.y - 22, t().traegt(n), "#ffd34d", 15);
  }
  function treffen(e, schaden, art, still) {
    if (e.tot) return;
    const d = e.d, A = S.A;
    if (d.unbesiegbar) { if (!still && Math.random() < 0.15) funken(e.x, e.y, 3, ["#9fd6ec"], 40); return; }
    if (d.ausweichen && (art === "schuss" || art === "biss" || art === "kette") && Math.random() < d.ausweichen) { if (!still) text(e.x, e.y - 14, "!", "#c49ae0", 14, 0.6); return; }
    if (art === "feuer" && d.feuerSchwach) schaden *= 2;
    if (e.bruchT > 0) schaden *= 1.25;
    if (e.markT > 0 && e.flug) schaden *= 1.3;
    if (e.schild > 0) { const ab = Math.min(e.schild, schaden); e.schild -= ab; schaden -= ab; if (e.schild <= 0 && !still) { funken(e.x, e.y, 10, ["#e0a046", "#ffd34d"], 70); KLANG.stein(); } }
    e.hp -= schaden; if (!still) e.treffT = 0.12;
    if (e.hp <= 0) {
      e.tot = true; A.erlegt++; S.erlegtGesamt++;
      if (d.boss && !d.unbesiegbar) { STAT.bosse[e.typ] = 1; erfolgPruefen("bosse"); }
      if (e.typ === "drokey" && !still) { banner(t().drokeyWeg, "#c9c4bc", 2.4); funken(e.x, e.y, 24, ["#55555f", "#c9c4bc", "#ffd34d"], 90); }
      if (e.beute) goldZurueck(e);
      if (e.seuche && e.giftT > 0) A.feinde.forEach(o => { if (o !== e && !o.tot && abst(o.x, o.y, e.x, e.y) < 46) { o.gift = Math.max(o.gift, e.gift); o.giftT = 3; o.seuche = true; S.blitze.push({ art: "sporenwolke", x: o.x, y: o.y, r: 16, t: 0, dauer: 0.5 }); } });
      const zaeh = d.boss ? 1 : (A.hpBonus || 1), el = e.elite ? 1 : 0;
      A.punkte += Math.round(d.pkt * zaeh * mod("punkte") * (el ? 2 : 1));
      const saat = Math.round((Math.round(d.pkt * 0.18 * zaeh) + 1) * mod("saat") * (el ? 3 * mod("eliteBeute") : 1));
      if (e.elite === "teilung") for (let i = 0; i < 2; i++) {
        const n = feindNeu(e.typ, e.flug ? 0 : Math.max(0, e.s - 8 - i * 12)); A.gesamt++;
        n.hp = n.max = e.max / ELITE.teilung.hp * 0.4; n.r = Math.max(6, e.r * 0.75);
        if (e.flug) { n.x = e.x + (i ? 12 : -12); n.y = e.y; }
      }
      A.saat += saat;
      if (d.boss) { text(e.x, e.y - 20, "+" + d.pkt, "#ffd34d", 22); funken(e.x, e.y, 40, ["#e0a046", "#c4564a", "#ebe2cc"], 150, 3.5); KLANG.boom(); S.beben = 0.4; }
      else { funken(e.x, e.y, 8, [d.farbe, "#ebe2cc"], 70); text(e.x, e.y - 10, "+" + saat + " 🌱", "#cfe6a8", 11, 0.9); KLANG.tod(); }
      S.blitze.push({ art: "tod", x: e.x, y: e.y, r: e.r, t: 0, dauer: 0.45 });
    }
  }

  /* Festhalten mit kurzer Unempfindlichkeit danach – sonst ließen sich Gegner endlos betäuben */
  function festhalten(e, dauer) {
    if (!e || e.tot) return;
    if (e.festSperre > 0 && e.festT <= 0) { e.bremse = Math.min(e.bremse, 0.6); e.bremsT = Math.max(e.bremsT, 0.6); return; }
    if (e.festT > 0) { e.festT = Math.max(e.festT, Math.min(dauer, e.festT + 0.2)); return; }
    e.festT = e.d.boss ? Math.min(dauer, 0.5) : dauer; e.festSperre = e.festT + 1.6;
  }
  function sichtbarFuer(e) { return !e.tot && !e.unsT; }
  function imKreis(x, y, r) { return S.A.feinde.filter(e => sichtbarFuer(e) && abst(x, y, e.x, e.y) <= r + e.r); }

  function zielSortieren(l, T, p) {
    const m = T.ziel || "vorne";
    if (m === "stark") return l.slice().sort((a, b) => b.hp - a.hp);
    if (m === "nah") return l.slice().sort((a, b) => abst(p.x, p.y, a.x, a.y) - abst(p.x, p.y, b.x, b.y));
    return l.slice().sort((a, b) => fortschritt(b) - fortschritt(a));
  }
  const turmSk = () => 1 + 0.03 * Math.min(S.lv, KAMPAGNE + 10);
  function turmUpdate(p, dt) {
    const T = p.turm;
    T.wachs = Math.min(1, (T.wachs || 0) + dt * 2.5);
    if (T.tier) { tierUpdate(p, dt); return; }
    const w = WACHTER[T.k], st = T.st, zw2 = st >= 2 ? T.zweig : null;
    T.anim = Math.max(0, (T.anim || 0) - dt);
    if (T.netz) T.netz = Math.max(0, T.netz - dt);
    if (T.ausT > 0) { T.ausT -= dt; return; }
    T.cd -= dt * (S.A.barradinT > 0 ? 1.7 : 1) * (T._tempo || 1) * mod("rate", T.k); if (T.cd > 0) return;
    const reich = w.reich[st] * (T._reich || 1) * mod("reich", T.k), sch = w.schaden[st] * turmSk() * mod("schaden", T.k), bremsF = mod("bremsT");
    let ziele = imKreis(p.x, p.y, reich);
    if (w.typ === "biss") ziele = ziele.filter(e => !e.flug);
    if (!ziele.length) { T.cd = 0.1; return; }
    const wahl = l => zielSortieren(l, T, p);
    if (w.typ === "biss" && (T.draussen || 0) > 0) {
      /* Sicherheitsnetz: zählt der Bau Wölfe, die es gar nicht mehr gibt, wieder freigeben */
      T.draussen = S.A.geschosse.filter(g => g.art === "wolf" && g.turm === T && !g.weg).length;
      if (T.draussen > 0) { T.cd = 0.1; return; }
    }
    T.cd = w.rate; T.anim = 0.3;
    if (w.typ === "schuss") {
      const zs = wahl(ziele).slice(0, zw2 === "b" ? 3 : 1);
      zs.forEach((z, i) => {
        const wi = Math.atan2(z.y - (p.y - 12), z.x - p.x); if (i === 0) T.winkel = wi;
        S.A.geschosse.push({ art: "dorn", x: p.x + Math.cos(wi) * 10, y: p.y - 12 + Math.sin(wi) * 10, ziel: z, schaden: sch * (zw2 === "b" ? 0.75 : 1), t: 0, w: wi, st, gift: (zw2 === "a" ? sch * 0.6 : 0) + (hat("giftdorn") ? sch * 0.35 : 0) });
      });
      KLANG.dorn();
    } else if (T.k === "wurzel") {
      ziele.forEach(e => {
        e.wurzelT = 2.2;
        treffen(e, sch * (zw2 === "b" ? 2.2 : 1), "wurzel", true);
        if (zw2 === "b") e.bruchT = 3;
        S.blitze.push({ art: "wurzelstich", x: e.x, y: e.y, t: 0, dauer: 0.55, seed: Math.random() });
        if (e.d.wurzelFest) return;
        e.bremse = Math.min(e.bremse, w.bremse[st]); e.bremsT = Math.max(e.bremsT, w.bremsT * bremsF);
        if (zw2 === "a") { if (e.d.boss) festhalten(e, 0.4); else festhalten(e, 1.2); }
        else if (st >= 2) festhalten(e, 0.5);
      });
      S.blitze.push({ art: "ring", x: p.x, y: p.y + 4, r: reich, t: 0, dauer: 0.5 });
      KLANG.wurzel();
    } else if (T.k === "eis") {
      wahl(ziele).slice(0, w.ziele[st]).forEach((e, i) => {
        const a = -Math.PI / 2 + (i - (w.ziele[st] - 1) / 2) * 0.5;
        S.A.geschosse.push({ art: "splitter", x: p.x + Math.cos(a) * 6, y: p.y - 16 + Math.sin(a) * 6, ziel: e, schaden: sch, bremse: w.bremse[st], bremsT: w.bremsT * bremsF, t: 0, w: a, dreh: 0, frost: zw2 === "a", teilen: zw2 === "b" });
      });
      S.blitze.push({ art: "frost", x: p.x, y: p.y - 6, r: 24, t: 0, dauer: 0.35 });
      KLANG.frost();
    } else if (w.typ === "biss") {
      const n = zw2 === "a" ? 3 : zw2 === "b" ? 1 : w.ziele[st];
      ziele.sort((a, b) => abst(p.x, p.y, a.x, a.y) - abst(p.x, p.y, b.x, b.y)).slice(0, n).forEach(e => {
        T.draussen = (T.draussen || 0) + 1;
        S.A.geschosse.push({ art: "wolf", x: p.x, y: p.y + 2, heim: { x: p.x, y: p.y + 2 }, reich, ziel: e, schaden: sch * (zw2 === "b" ? 3 : 1), zustand: "hin", turm: T, t: 0, links: e.x < p.x, alpha: zw2 === "b" });
      });
      KLANG.biss();
    } else if (w.typ === "kette") {
      let z = wahl(ziele)[0], x0 = p.x, y0 = p.y - 30 - st * 2, s = sch * (zw2 === "b" ? 3 : 1);
      const n = (zw2 === "a" ? 7 : zw2 === "b" ? 1 : w.ziele[st]) + (hat("donnerhall") ? 2 : 0), abfall = zw2 === "a" ? 0.9 : 0.8;
      const gehabt = new Set();
      for (let i = 0; i < n && z; i++) {
        gehabt.add(z);
        S.blitze.push({ art: "blitz", x1: x0, y1: y0, x2: z.x, y2: z.y, t: 0, dauer: 0.3, seed: Math.random(), dick: zw2 === "b" });
        const gefroren = z.eisT > 0;
        treffen(z, s * (gefroren ? 1.5 : 1), "kette");
        if (gefroren) kombo(z);
        if (zw2 === "b" && !z.tot && !z.d.boss) festhalten(z, 0.6);
        funken(z.x, z.y, zw2 === "b" ? 12 : 4, ["#f3e27a", "#ffffff"], 60, 1.6);
        x0 = z.x; y0 = z.y; s *= abfall;
        z = S.A.feinde.filter(e => sichtbarFuer(e) && !gehabt.has(e) && abst(x0, y0, e.x, e.y) < 85).sort((a, b) => abst(x0, y0, a.x, a.y) - abst(x0, y0, b.x, b.y))[0];
      }
      KLANG.blitz();
    } else if (w.typ === "gift") {
      wahl(ziele).slice(0, w.ziele[st]).forEach((e, i) => {
        const vor = e.flug ? { x: e.x, y: e.y } : pfadPunkt(S.A.P, e.s + e.v * e.bremse * 0.55);
        S.A.geschosse.push({ art: "spore", x0: p.x + (i - 1) * 5, y0: p.y - 10, x1: vor.x, y1: vor.y, x: p.x, y: p.y - 10, t: 0, dauer: 0.55, schaden: sch, r: (zw2 === "b" ? 44 : 28) * (hat("pilzring") ? 1.3 : 1), seuche: zw2 === "a", bremst: zw2 === "b" });
      });
    }
  }

  /* ---------- Tiergefährten ---------- */
  const wild = () => 1 + 0.15 * tal("wildnis");
  const tierMax = () => 1 + tal("tierfreund");
  function tierPosten(p) {
    const P = S.A.P; let best = 0, bd = 1e9;
    for (let s = 20; s < P.gesamt - 20; s += 4) { const q = pfadPunkt(P, s), d = abst(q.x, q.y, p.x, p.y); if (d < bd) { bd = d; best = s; } }
    const q = pfadPunkt(P, best); p.turm.postS = best; p.turm.postX = q.x; p.turm.postY = q.y;
  }
  function baerMaxHp(T) { return 260 * (1 + 0.14 * S.lv) * (T.st ? 1.6 : 1) * wild(); }
  function aurenBerechnen(A) {
    const turme = A.plaetze.filter(p => p.turm && !p.turm.tier);
    turme.forEach(p => { p.turm._reich = 1; p.turm._tempo = 1; });
    A.plaetze.forEach(q => {
      const T = q.turm; if (!T || !T.tier || !(T.k === "eule" || T.k === "hirsch")) return;
      const r = TIERE[T.k].reich[T.st];
      turme.forEach(p => {
        if (abst(p.x, p.y, q.x, q.y) > r) return;
        if (T.k === "eule") p.turm._reich = Math.max(p.turm._reich, T.st ? 1.3 : 1.2);
        else p.turm._tempo = Math.max(p.turm._tempo, T.st ? 1.4 : 1.25);
      });
    });
  }
  function baerenVorbereiten(A) {
    A.feinde.forEach(e => { e.halt = false; e.baerBremse = false; });
    A.plaetze.forEach(p => {
      const T = p.turm; if (!T || !T.tier || T.k !== "baer" || T.schlafT > 0) return;
      const cap = T.st ? 3 : 2, nah = [];
      A.feinde.forEach(e => {
        if (e.tot || e.flug || e.d.unbesiegbar) return;
        const vor = e.flieht ? e.s - T.postS : T.postS - e.s;
        if (vor < -4 || vor > 18) return;
        if (e.d.boss) { e.baerBremse = true; nah.push(e); return; }
        nah.push(e);
      });
      nah.sort((a, b) => Math.abs(a.s - T.postS) - Math.abs(b.s - T.postS));
      T.blockiert = [];
      nah.forEach(e => { if (e.d.boss) { T.blockiert.push(e); return; } if (T.blockiert.filter(o => !o.d.boss).length < cap) { e.halt = true; T.blockiert.push(e); } });
    });
  }
  function tierUpdate(p, dt) {
    const T = p.turm, A = S.A, sk = turmSk() * wild() * mod("tier"), st = T.st;
    T.anim = Math.max(0, (T.anim || 0) - dt);
    if (T.ausT > 0) { T.ausT -= dt; return; }
    T.faehigT -= dt * (A.barradinT > 0 ? 1.4 : 1);
    if (T.k === "baer") {
      const max = baerMaxHp(T); if (!T.hp) T.hp = max;
      if (T.schlafT > 0) { T.schlafT -= dt; if (T.schlafT <= 0) { T.hp = max; text(T.postX, T.postY - 24, "🐻!", "#ebe2cc", 15); } return; }
      const geg = (T.blockiert || []).filter(e => !e.tot);
      if (geg.length) {
        T.hp -= geg.reduce((a, e) => a + (4 + e.d.klau * 0.3) * (e.d.boss ? 3 : 1) * (1 + 0.08 * S.lv), 0) * dt;
        if (T.faehigT <= 0) {
          T.faehigT = 1.0; T.anim = 0.3;
          geg.forEach(e => treffen(e, 40 * (st ? 1.6 : 1) * sk, "baer"));
          S.blitze.push({ art: "prankenhieb", x: T.postX, y: T.postY, t: 0, dauer: 0.3, links: geg[0].x < T.postX });
          KLANG.biss();
        }
        if (T.hp <= 0) { T.hp = 0; T.schlafT = st ? 9 : 12; text(T.postX, T.postY - 22, t().schlaeft, "#a89f8f", 13); KLANG.grummeln(); }
      } else T.hp = Math.min(max, T.hp + max * 0.04 * dt);
    } else if (T.k === "eule") {
      const r = TIERE.eule.reich[st];
      A.feinde.forEach(e => { if (!e.tot && abst(e.x, e.y, p.x, p.y) < r) { e.enthuelltT = 0.3; if (e.flug) e.markT = 0.3; } });
    } else if (T.k === "hirsch") {
      if (T.faehigT <= 0) {
        const z = A.feinde.filter(e => !e.tot && !e.flug && !e.d.unbesiegbar && abst(e.x, e.y, p.x, p.y) < 85).sort((a, b) => fortschritt(b) - fortschritt(a))[0];
        if (z) {
          T.faehigT = st ? 7 : 10; T.anim = 0.4; T.stossX = z.x; T.stossY = z.y;
          treffen(z, 35 * sk, "stoss");
          if (!z.d.boss && !z.tot) { z.s = z.flieht ? z.s + 50 : Math.max(0, z.s - 55); festhalten(z, 1); }
          S.blitze.push({ art: "stoss", x: z.x, y: z.y, x0: p.x, y0: p.y, t: 0, dauer: 0.4 });
          KLANG.stein();
        } else T.faehigT = 0.5;
      }
    } else if (T.k === "keiler") {
      if (T.faehigT <= 0) {
        const kommt = A.feinde.some(e => !e.tot && !e.flug && Math.abs(e.s - T.postS) < 200);
        if (kommt) {
          T.faehigT = st ? 7 : 9;
          A.ansturm.push({ s: T.postS, ende: Math.max(0, T.postS - (st ? 210 : 150)), getroffen: new Set(), sch: 45 * (st ? 1.6 : 1) * sk, t: 0 });
          KLANG.bruellen();
        } else T.faehigT = 0.5;
      }
    } else if (T.k === "falke") {
      if (T.unterwegs && !A.geschosse.some(g => g.art === "falke" && g.turm === T)) T.unterwegs = false;
      if (T.faehigT <= 0 && !T.unterwegs) {
        const l = A.feinde.filter(e => !e.tot && !e.d.unbesiegbar && !e.unsT);
        const z = l.filter(e => e.beute)[0] || l.filter(e => e.flug).sort((a, b) => fortschritt(b) - fortschritt(a))[0] || l.sort((a, b) => fortschritt(b) - fortschritt(a))[0];
        if (z) {
          T.faehigT = st ? 3 : 4.5; T.unterwegs = true;
          A.geschosse.push({ art: "falke", x: p.x, y: p.y - 14, heim: { x: p.x, y: p.y - 14 }, ziel: z, zustand: "hin", turm: T, t: 0, schaden: 70 * (st ? 1.5 : 1) * sk });
          ton("sawtooth", 1500, 2400, 0.2, 0.04, 0, ["bandpass", 2000, 3]);
        } else T.faehigT = 0.4;
      }
    } else if (T.k === "dachs") {
      const max = st ? 4 : 3, meine = A.fallen.filter(f => f.T === T).length;
      if (T.faehigT <= 0) {
        if (meine < max) {
          T.faehigT = st ? 5 : 7; T.anim = 0.4;
          const s0 = klemm(T.postS + zw(-60, 60), 20, A.P.gesamt - 20), q = pfadPunkt(A.P, s0);
          A.fallen.push({ T, s: s0, x: q.x, y: q.y, t: 0, sch: 55 * (st ? 1.5 : 1) * sk });
          funken(q.x, q.y, 8, ["#6b4a30", "#a8783e"], 50);
        } else T.faehigT = 1;
      }
    }
  }
  function tiereUpdate(A, dt) {
    A.ansturm.forEach(a => {
      a.t += dt; a.s -= 280 * dt;
      const q = pfadPunkt(A.P, Math.max(0, a.s)); a.x = q.x; a.y = q.y; a.w = q.w;
      A.feinde.forEach(e => {
        if (e.tot || e.flug || a.getroffen.has(e) || abst(e.x, e.y, a.x, a.y) > 20 + e.r) return;
        a.getroffen.add(e); treffen(e, a.sch, "keiler");
        if (!e.tot && !e.d.boss && !e.d.unbesiegbar) { e.s = e.flieht ? e.s + 30 : Math.max(0, e.s - 40); festhalten(e, 0.5); }
        funken(e.x, e.y, 6, ["#8a6440", "#ebe2cc"], 70);
      });
      if (a.s <= a.ende) a.weg = true;
    });
    A.ansturm = A.ansturm.filter(a => !a.weg);
    A.fallen.forEach(f => {
      f.t += dt;
      const e = A.feinde.find(e => !e.tot && !e.flug && !e.d.unbesiegbar && abst(e.x, e.y, f.x, f.y) < 12 + e.r * 0.5);
      if (!e) return;
      f.weg = true; treffen(e, f.sch, "falle");
      if (!e.tot) festhalten(e, e.d.boss ? 0.6 : 1.5);
      S.blitze.push({ art: "falle", x: f.x, y: f.y, t: 0, dauer: 0.5 });
      funken(f.x, f.y, 10, ["#6b4a30", "#a8783e", "#ebe2cc"], 80); KLANG.stein();
    });
    A.fallen = A.fallen.filter(f => !f.weg && (!f.T || A.plaetze.some(p => p.turm === f.T)));
  }
  const fortschritt = e => e.flieht ? (e.beute ? 5000 : 0) + (e.flug ? 1000 - abst(e.x, e.y, S.A.P.p[0].x, S.A.P.p[0].y) : S.A.P.gesamt - e.s) : e.flug ? 1000 - abst(e.x, e.y, HORT.x, HORT.y) : e.s;

  /* ---------- Gastauftritte: Rex, Barradin, Ezekiel ---------- */
  function helferUpdate(dt) {
    const A = S.A, T = t().helfer;
    A.barradinT = Math.max(0, A.barradinT - dt);
    if (A.portrait) { A.portrait.t += dt; if (A.portrait.t > 2.8) A.portrait = null; }
    A.helferT -= dt;
    if (A.helferT <= 0 && !A.helfer.length) {
      const lebend = A.feinde.filter(e => !e.tot && !e.d.unbesiegbar);
      if (lebend.length >= 2 || lebend.some(e => e.beute)) {
        const moegl = ["rex", "barradin", "ezekiel"].filter(k => k !== A.letzterHelfer);
        if (lebend.some(e => e.beute)) moegl.push(A.letzterHelfer === "rex" ? "ezekiel" : "rex");
        if (helferStart(zufall(moegl))) A.helferT = zw(18, 26) * [1, 0.72, 0.5][up("freunde")];
        else A.helferT = 2;
      } else A.helferT = 1.5;
    }
    A.helfer.forEach(h => {
      h.t += dt;
      if (h.art === "rex") {
        const v = 300 * dt;
        if (h.zustand === "hin") {
          let z = h.ziel;
          if (!z || z.tot) z = h.ziel = rexZiel();
          if (!z) { h.zustand = "weg"; return; }
          const dx = z.x - h.x, dy = z.y - h.y, d = Math.hypot(dx, dy);
          h.links = dx < 0;
          if (d < 16) {
            h.zustand = "bellen"; h.bellT = 0.7; KLANG.bellen();
            text(h.x, h.y - 26, T.rexText, "#ebe2cc", 14);
            A.feinde.forEach(e => {
              if (e.tot || e.d.boss || e.d.unbesiegbar || abst(e.x, e.y, h.x, h.y) > 70) return;
              if (e.beute) { goldZurueck(e); text(h.x, h.y - 42, T.rexSack, "#ffd34d", 13); STAT.rex = (STAT.rex || 0) + 1; erfolgPruefen("rex"); }
              if (!e.flug) e.s = e.flieht ? Math.max(1, e.s - 30) : Math.max(0, e.s - 70);
              e.bremse = Math.min(e.bremse, 0.5); e.bremsT = Math.max(e.bremsT, 2.2);
              text(e.x, e.y - 16, "!", "#ebe2cc", 15, 0.8);
            });
            return;
          }
          h.x += dx / d * v; h.y += dy / d * v;
        } else if (h.zustand === "bellen") {
          h.bellT -= dt; if (h.bellT <= 0) { h.zustand = "weg"; h.links = h.x < W / 2; }
        } else {
          h.x += (h.links ? -1 : 1) * v * 1.2;
          if (h.x < -30 || h.x > W + 30) h.fertig = true;
        }
      } else if (h.art === "barradin") {
        if (h.t > 7.2) h.fertig = true;
        h.noteT = (h.noteT || 0) - dt;
        if (h.noteT <= 0 && h.t < 7) { h.noteT = 0.35; S.texte.push({ x: h.x + zw(-12, 12), y: h.y - 24, s: zufall(["♪", "♫", "♩"]), farbe: zufall(["#e0a046", "#ffd34d", "#cfe6a8"]), gross: 15, t: 0, dauer: 1.4 }); }
      } else if (h.art === "ezekiel") {
        h.schlagT -= dt;
        if (h.schlagT <= 0) {
          if (h.i >= h.ziele.length) { if (h.schlagT < -0.6) h.fertig = true; return; }
          let z = h.ziele[h.i++];
          if (!z || z.tot) z = ezekielZiele(1, h.ziele)[0];
          if (!z) { h.schlagT = 0; return; }
          funken(h.x, h.y, 10, ["#2a1414", "#4a1c18", "#000000"], 60, 3);
          h.x = z.x + (z.x < W / 2 ? 12 : -12); h.y = z.y - 2; h.links = z.x < h.x; h.sichtT = 0;
          const sch = z.d.boss ? z.max * 0.16 : z.hp + 1;
          treffen(z, sch, "dolch");
          if (z.tot) { STAT.ezekiel = (STAT.ezekiel || 0) + 1; erfolgPruefen("ezekiel"); }
          S.blitze.push({ art: "schnitt", x: z.x, y: z.y, t: 0, dauer: 0.4, seed: Math.random() });
          funken(z.x, z.y, 12, ["#c4564a", "#9b2a20", "#ffd0c0"], 110, 2.4);
          KLANG.schnitt();
          h.schlagT = 0.42;
        }
        h.sichtT = (h.sichtT || 0) + dt;
      }
    });
    A.helfer = A.helfer.filter(h => !h.fertig);
  }
  function rexZiel() {
    const A = S.A;
    return A.feinde.filter(e => !e.tot && !e.d.boss && !e.d.unbesiegbar && !e.unsT)
      .sort((a, b) => ((b.beute ? 1e4 : 0) + fortschritt(b)) - ((a.beute ? 1e4 : 0) + fortschritt(a)))[0] || null;
  }
  function ezekielZiele(n, ohne) {
    return S.A.feinde.filter(e => !e.tot && !e.d.unbesiegbar && !(ohne || []).includes(e))
      .sort((a, b) => ((b.beute ? 1e5 : 0) + (b.d.boss ? 5e4 : 0) + b.hp) - ((a.beute ? 1e5 : 0) + (a.d.boss ? 5e4 : 0) + a.hp)).slice(0, n);
  }
  function helferStart(art) {
    const A = S.A, T = t().helfer;
    if (art === "rex") {
      const z = rexZiel(); if (!z) return false;
      const links = z.x > W / 2;
      A.helfer.push({ art, x: links ? W + 20 : -20, y: klemm(z.y, 40, LEISTE - 30), ziel: z, zustand: "hin", t: 0, links });
      KLANG.bellen();
    } else if (art === "barradin") {
      A.barradinT = 7;
      A.helfer.push({ art, x: HORT.x - 62, y: HORT.y - 6, t: 0 });
      KLANG.laute(); text(W / 2, 150, T.barradinText, "#cfe6a8", 13, 2.4);
    } else {
      const ziele = ezekielZiele(2 + (S.lv >= 8 ? 1 : 0) + (S.lv >= 18 ? 1 : 0));
      if (!ziele.length) return false;
      A.helfer.push({ art, ziele, i: 0, t: 0, schlagT: 0.3, x: ziele[0].x, y: ziele[0].y, links: false, sichtT: 0 });
      text(W / 2, 150, T.ezekielText, "#c4564a", 13, 2);
    }
    A.letzterHelfer = art; A.portrait = { art, t: 0 };
    banner(T[art], art === "ezekiel" ? "#c4564a" : art === "barradin" ? "#e0a046" : "#ebe2cc", 1.5);
    return true;
  }

  function giftAtem(e) {
    const A = S.A;
    A.plaetze.forEach(p => { if (p.turm && abst(p.x, p.y, e.x, e.y) < 100) p.turm.ausT = Math.max(p.turm.ausT, 3); });
    S.blitze.push({ art: "gift", x: e.x, y: e.y, r: 100, t: 0, dauer: 1.2 });
    text(e.x, e.y - 30, t().gift, "#8ac24a", 16); KLANG.puff();
  }

  function turmBeschaedigen(p, durchWurf) {
    if (!p || !p.turm) return;
    if (p.turm.tier) {
      const T = p.turm;
      if (T.k === "baer") { T.hp = 0; T.schlafT = Math.max(T.schlafT || 0, 8); } else T.ausT = Math.max(T.ausT || 0, 6);
      text(p.x, p.y - 24, t().benommen, "#a89f8f", 13); funken(p.x, p.y, 12, ["#a8a090", "#ebe2cc"], 80);
      const A = S.A; A.zorn = klemm(A.zorn + 8 * zornFaktor(), 0, 100);
      if (A.zorn >= 100 && durchWurf) ausbruchAbwehr();
      return;
    }
    if (p.turm.st > 0) { p.turm.st--; if (p.turm.st < 2) p.turm.zweig = null; } else p.turm = null;
    funken(p.x, p.y, 12, ["#6f9a3a", "#8a6440", "#ebe2cc"], 80); gartenSync();
    const A = S.A;
    A.zorn = klemm(A.zorn + 8 * zornFaktor(), 0, 100);
    if (A.zorn >= 100 && durchWurf) ausbruchAbwehr();
  }

  function kombo(e, txt) {
    S.statistik.kombos = (S.statistik.kombos || 0) + 1;
    if ((S.komboT || 0) < performance.now()) { S.komboT = performance.now() + 600; text(e.x, e.y - 24, txt || t().kombo, "#9fd6ec", 13, 0.9); }
    erfolgPruefen("kombo");
  }
  function explosion(x, y, r, schaden) {
    let spore = false;
    imKreis(x, y, r).forEach(e => {
      if (e.giftT > 0 && !e.tot) {
        spore = true; e.giftT = 0;
        treffen(e, schaden * 0.5, "feuer");
        S.A.feinde.forEach(o => { if (o !== e && !o.tot && abst(o.x, o.y, e.x, e.y) < 36) treffen(o, schaden * 0.35, "feuer"); });
        S.blitze.push({ art: "sporenwolke", x: e.x, y: e.y, r: 30, t: 0, dauer: 0.6 });
        funken(e.x, e.y, 10, ["#c49ae0", "#ff8a3a"], 100); kombo(e, t().sporenExplosion);
      }
      treffen(e, schaden, "feuer");
    });
    S.A.feinde.filter(e => e.unsT && abst(x, y, e.x, e.y) <= r + e.r).forEach(e => treffen(e, schaden, "feuer"));
    S.blitze.push({ art: "explosion", x, y, r, t: 0, dauer: 0.55 });
    funken(x, y, 26, ["#e0a046", "#ffd34d", "#c4564a", "#ff8a3a"], 150, 3);
    KLANG.boom(); S.beben = Math.max(S.beben || 0, 0.25); vib(25);
  }

  const zauberFrei = () => ZAUBER_REIHE.filter(k => S.lv >= ZAUBER[k].ab);
  function zauberWahlPruefen() {
    const frei = zauberFrei();
    let w = (S.zauber || []).filter(k => frei.includes(k));
    frei.forEach(k => { if (w.length < Math.min(2, frei.length) && !w.includes(k)) w.push(k); });
    S.zauber = w.slice(0, 2);
    return S.zauber;
  }
  function zauberWirken(x, y) {
    const A = S.A, z = A.zauber[A.aktiv]; if (!z) return;
    if (z.cd > 0) { text(x, y, Math.ceil(z.cd) + " s", "#a89f8f", 13, 0.7); return; }
    z.cd = z.max;
    const sk = (1 + 0.06 * Math.min(S.lv, KAMPAGNE + 10)) * mod("zauberSchaden");
    if (z.k === "feuerball") {
      A.geschosse.push({ art: "feuerball", x0: HORT.x, y0: HORT.y - 26, x1: x, y1: y, x: HORT.x, y: HORT.y - 26, t: 0, dauer: 0.38, r: 50 + 8 * up("feuer"), schaden: 70 * (1 + 0.25 * up("feuer")) * sk });
      knistern(0.3, 0.12, "bandpass", 1400);
    } else if (z.k === "eissturm") {
      const r = 74;
      A.feinde.filter(e => !e.tot && abst(x, y, e.x, e.y) <= r + e.r).forEach(e => {
        e.eisT = 3; treffen(e, 25 * sk, "frost", true);
        if (e.d.boss) { e.bremse = Math.min(e.bremse, 0.5); e.bremsT = Math.max(e.bremsT, 2.5); } else festhalten(e, 2.2);
      });
      S.blitze.push({ art: "frost", x, y, r, t: 0, dauer: 0.7 });
      funken(x, y, 34, ["#ffffff", "#cfeaf4", "#9fd6ec"], 120, 2.5);
      KLANG.frost(); KLANG.puff(); vib(40);
    } else if (z.k === "mondstrahl") {
      A.mond = { x, y, r: 38, t: 0, dauer: 4.5, dps: 52 * sk };
      [1318, 1760, 2093].forEach((f, i) => ton("sine", f, f, 0.6, 0.04, i * 0.08));
    } else if (z.k === "adler") {
      const sx = HORT.x + 40, sy = HORT.y - 30, l = Math.hypot(x - sx, y - sy) || 1;
      A.adler = { x: sx, y: sy, vx: (x - sx) / l * 540, vy: (y - sy) / l * 540, getroffen: new Set(), t: 0 };
      ton("sawtooth", 1400, 2200, 0.25, 0.05, 0, ["bandpass", 1800, 3]);
    } else if (z.k === "erdbeben") {
      A.feinde.forEach(e => {
        if (e.tot || e.flug) return;
        treffen(e, 35 * sk, "erde", true);
        e.bremse = Math.min(e.bremse, 0.4); e.bremsT = Math.max(e.bremsT, 3);
        if (!e.d.boss) festhalten(e, 0.5);
      });
      for (let i = 0; i < 7; i++) { const q = pfadPunkt(A.P, Math.random() * A.P.gesamt); S.blitze.push({ art: "riss", x: q.x, y: q.y, t: 0, dauer: 1.2, seed: Math.random() }); }
      S.beben = 0.9; KLANG.boom(); KLANG.bruellen(); vib(220);
    }
  }
  function zauberUpdate(dt) {
    const A = S.A;
    if (A.mond) {
      const M = A.mond; M.t += dt;
      A.feinde.forEach(e => { if (!e.tot && abst(M.x, M.y, e.x, e.y) <= M.r + e.r) { e.enthuelltT = 0.3; treffen(e, M.dps * dt, "mond", true); } });
      if (M.t > M.dauer) A.mond = null;
    }
    if (A.adler) {
      const B = A.adler; B.t += dt; B.x += B.vx * dt; B.y += B.vy * dt;
      const sk = (1 + 0.06 * Math.min(S.lv, KAMPAGNE + 10)) * mod("zauberSchaden");
      A.feinde.forEach(e => {
        if (e.tot || B.getroffen.has(e) || abst(B.x, B.y, e.x, e.y) > 22 + e.r) return;
        B.getroffen.add(e); if (e.beute) goldZurueck(e);
        treffen(e, 60 * sk, "adler"); funken(e.x, e.y, 6, ["#c9a35a", "#ebe2cc"], 70);
      });
      if (B.x < -30 || B.x > W + 30 || B.y < -30 || B.y > H + 30) A.adler = null;
    }
  }

  function ausbruchAbwehr() {
    const A = S.A; A.zorn = 0;
    quip("zorn", 1);
    if (Math.random() < 0.65 || A.baer) {
      if (A.baer) return;
      A.baer = { s: A.P.gesamt, x: HORT.x, y: HORT.y, getroffen: new Map(), geprueft: new Set(), t: 0 };
      banner(t().ausbruch.baer, "#c4564a", 1.6); KLANG.bruellen(); S.beben = 0.5;
    } else {
      banner(t().ausbruch.feuersturm, "#c4564a", 1.6);
      const sk = 1 + 0.06 * Math.min(S.lv, KAMPAGNE + 10);
      imKreis(HORT.x, HORT.y, 140).forEach(e => treffen(e, 160 * sk, "feuer"));
      S.blitze.push({ art: "explosion", x: HORT.x, y: HORT.y - 10, r: 140, t: 0, dauer: 0.8 });
      funken(HORT.x, HORT.y, 50, ["#e0a046", "#ffd34d", "#c4564a"], 220, 4);
      const t2 = A.plaetze.filter(p => p.turm).sort((a, b) => abst(a.x, a.y, HORT.x, HORT.y) - abst(b.x, b.y, HORT.x, HORT.y))[0];
      if (t2 && abst(t2.x, t2.y, HORT.x, HORT.y) < 150) { t2.turm.ausT = Math.max(t2.turm.ausT || 0, 3); text(t2.x, t2.y - 20, "🔥", "#c4564a", 18); }
      KLANG.boom(); S.beben = 0.6;
    }
  }

  function baerUpdate(dt) {
    const A = S.A, B = A.baer, bk = up("baerenkraft");
    B.t += dt; B.s -= 150 * dt;
    const q = pfadPunkt(A.P, B.s); B.x = q.x; B.y = q.y; B.w = q.w;
    const sch = 60 * (1 + 0.4 * bk) * (1 + 0.06 * Math.min(S.lv, KAMPAGNE + 10));
    A.feinde.forEach(e => {
      if (e.tot || abst(e.x, e.y, B.x, B.y) > 22 + e.r) return;
      const z = B.getroffen.get(e) || 0;
      if (B.t - z < 0.5 && B.getroffen.has(e)) return;
      B.getroffen.set(e, B.t);
      treffen(e, sch, "baer"); funken(e.x, e.y, 6, ["#a8783e", "#ebe2cc"], 70);
      if (!e.d.boss && !e.tot) { festhalten(e, 0.6); }
    });
    const chance = up("sanft") ? 0 : [0.45, 0.28, 0.14][bk];
    A.plaetze.forEach(p => {
      if (!p.turm || B.geprueft.has(p) || abst(p.x, p.y, B.x, B.y) > 46) return;
      B.geprueft.add(p);
      if (Math.random() < chance) { p.turm.ausT = Math.max(p.turm.ausT || 0, 3); text(p.x, p.y - 22, "🐾", "#ebe2cc", 16); KLANG.stein(); }
    });
    if (B.s <= 0) { funken(B.x, B.y, 16, ["#a8783e", "#ebe2cc"], 80); A.baer = null; KLANG.puff(); }
  }

  /* Bauen */
  function wachterFrei(k) { return S.lv >= WACHTER[k].ab; }
  function tierFrei(k) { return S.lv >= TIERE[k].ab; }
  function kosten(k, st) { return Math.round(WACHTER[k].kosten[st] * (1 - 0.06 * tal("saatgut")) * (st === 3 ? mod("uraltPreis") : 1)); }
  function tierKosten(k, st) { return TIERE[k].kosten[st]; }
  function tierAnzahl(k) { return S.A.plaetze.filter(p => p.turm && p.turm.tier && p.turm.k === k).length; }
  function setzen(p, z, c) {
    const A = S.A;
    p.turm = turmNeu(Object.assign({ wert: c }, z)); p.turm.u = p.u; p.turm.frisch = 0; p.turm.ausBeutel = null;
    if (p.turm.tier) { tierPosten(p); if (p.turm.k === "baer") p.turm.hp = baerMaxHp(p.turm); }
    funken(p.x, p.y, 16, ["#6f9a3a", "#cfe6a8", "#ebe2cc"], 80); KLANG.bau(); vib(20);
    S.blitze.push({ art: "aufwertung", x: p.x, y: p.y, t: 0, dauer: 0.75, klein: true });
    A.wahl = -1; gartenSync();
  }
  function bauen(k) {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || p.turm) return;
    const c = kosten(k, 0); if (A.saat < c) { text(p.x, p.y - 20, t().bau.zuwenig, "#c4564a", 13); return; }
    A.saat -= c; A.bauTyp = k; schreib("imres-echohort-bautyp", k);
    setzen(p, { k, st: 0 }, c); p.turm.frisch = c;
  }
  function tierBauen(k) {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || p.turm) return;
    if (tierAnzahl(k) >= tierMax()) { text(p.x, p.y - 20, t().maxTier, "#c4564a", 13); return; }
    const c = tierKosten(k, 0); if (A.saat < c) { text(p.x, p.y - 20, t().bau.zuwenig, "#c4564a", 13); return; }
    A.saat -= c; A.tierTyp = k;
    setzen(p, { k, st: 0, tier: true }, c); p.turm.frisch = c;
  }
  function setzlingPflanzen(i) {
    const A = S.A, p = A.plaetze[A.wahl], G = S.garten; if (!p || p.turm || !G.setzlinge[i]) return;
    const z = G.setzlinge[i];
    if (z.tier && tierAnzahl(z.k) >= tierMax()) { text(p.x, p.y - 20, t().maxTier, "#c4564a", 13); return; }
    G.setzlinge.splice(i, 1);
    setzen(p, z, z.wert || 0); p.turm.ausBeutel = turmKurz(z);
    if (!G.setzlinge.length) A.bauTab = "waechter";
    A.setzWahl = 0;
  }
  function verstaerken(zweig) {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || !p.turm) return;
    const T = p.turm, max = T.tier ? 1 : TURM_MAX; if (T.st >= max) return;
    if (!T.tier && T.st === 1 && !zweig) return;
    const c = T.tier ? tierKosten(T.k, T.st + 1) : kosten(T.k, T.st + 1); if (A.saat < c) { text(p.x, p.y - 20, t().bau.zuwenig, "#c4564a", 13); return; }
    A.saat -= c; T.st++; T.wert += c; if (zweig) T.zweig = zweig; T.wachs = 0.4;
    if (A.vorT > 0 || A.halt) T.frisch = (T.frisch || 0) + c;
    S.blitze.push({ art: "aufwertung", x: p.x, y: p.y, t: 0, dauer: 1.1 }); text(p.x, p.y - 34, t().stufeHoch(T.st + 1), "#ffd34d", 15, 1.4);
    if (T.tier && T.k === "baer") T.hp = baerMaxHp(T);
    funken(p.x, p.y, 22, ["#e0a046", "#cfe6a8", "#ffd34d"], 100); KLANG.bau(); vib(25);
    gartenSync();
  }
  function zielWechseln() {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || !p.turm || p.turm.tier) return;
    const l = ["vorne", "stark", "nah"]; p.turm.ziel = l[(l.indexOf(p.turm.ziel || "vorne") + 1) % 3]; KLANG.griff();
  }
  /* Was gibt es beim Ausreißen zurück? In der Baupause wird ein Fehlgriff voll erstattet. */
  function rueckgabe(T) {
    const A = S.A, bau = A.vorT > 0 || A.halt, fr = bau ? (T.frisch || 0) : 0;
    if (bau && T.ausBeutel) return { beutel: true, saat: fr };
    return { beutel: false, saat: Math.round(fr + (T.wert - fr) * 0.5) };
  }
  function ausreissen() {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || !p.turm) return;
    const rg = rueckgabe(p.turm), n = rg.saat;
    if (rg.beutel) { S.garten.setzlinge.push(p.turm.ausBeutel); text(p.x, p.y - 34, t().zurueckBeutel, "#cfe6a8", 13); }
    A.saat += n; if (n) text(p.x, p.y - 20, "+" + n + " 🌱", "#cfe6a8", 13);
    p.turm = null; funken(p.x, p.y, 10, ["#8a6440", "#6f9a3a"], 70); KLANG.puff(); A.wahl = -1; gartenSync();
  }

  /* „Wie zuletzt“: Setzlinge in derselben Reihenfolge am Weg wieder einpflanzen */
  function wieZuletzt() {
    const A = S.A, G = S.garten; if (!G || !G.setzlinge.length) return;
    const n = G.setzlinge.length;
    const l = G.setzlinge.map((z, i) => ({ z, u: z.u != null ? z.u : i / Math.max(1, n - 1) })).sort((a, b) => a.u - b.u);
    let gesetzt = 0;
    l.forEach(o => {
      if (o.z.tier && tierAnzahl(o.z.k) >= tierMax()) return;
      let best = null, bd = 1e9;
      A.plaetze.forEach(p => { if (p.turm) return; const d = Math.abs(p.u - o.u) + (p.luft ? 0.04 : 0); if (d < bd) { bd = d; best = p; } });
      if (!best) return;
      G.setzlinge.splice(G.setzlinge.indexOf(o.z), 1);
      setzen(best, o.z, o.z.wert || 0); best.turm.ausBeutel = turmKurz(o.z); gesetzt++;
    });
    if (!G.setzlinge.length) A.bauTab = "waechter";
    A.setzWahl = 0; A.wahl = -1;
  }
  function abwehrTippen(p) {
    const A = S.A; if (A.fertig) return;
    const i = A.plaetze.findIndex(q => abst(q.x, q.y, p.x, p.y) < 24);
    if (i >= 0) {
      const jetzt = performance.now(), doppel = A.letzterTipp && A.letzterTipp.i === i && jetzt - A.letzterTipp.t < 400;
      A.letzterTipp = doppel ? null : { i, t: jetzt };
      if (doppel) {
        /* Doppeltipp: leerer Platz → gewählten Wächter pflanzen, Wächter → eine Stufe stärker */
        A.wahl = i; const T = A.plaetze[i].turm;
        if (T) { if (T.tier || T.st !== 1) verstaerken(); } else knopfDruck("pflanzen");
        return;
      }
      A.wahl = A.wahl === i ? -1 : i; KLANG.griff();
      if (!A.bauTyp || !wachterFrei(A.bauTyp)) { const l = lies("imres-echohort-bautyp", "dorn"); A.bauTyp = WACHTER[l] && wachterFrei(l) ? l : "dorn"; }
      if (S.garten.setzlinge.length) A.bauTab = "setz"; else if (A.bauTab === "setz") A.bauTab = "waechter";
      return;
    }
    if (A.wahl >= 0) { A.wahl = -1; return; }
    zauberWirken(p.x, p.y);
  }

  /* ================== ZEICHNEN ================== */
  const leinwand = document.createElement("canvas");
  const ctx = leinwand.getContext("2d");
  let skala = 1, hgBild = null, hgSchluessel = "";
  /* Themberchaud schaut im Raubzug über den Rand seiner Halle – kein Feind, nur ein sehr großer Zuschauer */
  const DRACHE = new Image(); DRACHE.decoding = "async";
  DRACHE.onload = () => { const g = GEB.findIndex(G => G.stil.horizont === "halle"); if (hgSchluessel === "raub" + g) { hgSchluessel = ""; hintergrundRaub(g); } };
  function dracheLaden() { if (!DRACHE.src) DRACHE.src = "themberchaud.webp"; }
  function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function neueLeinwand() {
    const f = 2, c = document.createElement("canvas"); c.width = W * f; c.height = H * f;
    const x = c.getContext("2d"); x.scale(f, f); return [c, x];
  }
  function oval(x, cx, cy, rx, ry, w) { x.beginPath(); x.ellipse(cx, cy, rx, ry, w || 0, 0, Math.PI * 2); x.fill(); }
  function kreis(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); }

  /* --- Hintergrund des Raubzugs: oben Echos Platz, darunter ein Querschnitt durch das Gebiet --- */
  function hintergrundRaub(g) {
    if (GEB[g].stil.horizont === "halle") dracheLaden();
    const k = "raub" + g; if (hgSchluessel === k) return; hgSchluessel = k;
    const G = GEB[g], F = G.f, ST = G.stil, [c, x] = neueLeinwand(), r = lcg(11 + g * 7);
    let gr = x.createLinearGradient(0, 0, 0, 100);
    gr.addColorStop(0, F.himmel[0]); gr.addColorStop(1, F.himmel[1]);
    x.fillStyle = gr; x.fillRect(0, 0, W, 100);
    // Horizont je nach Gebiet
    if (ST.horizont === "tannen") {
      for (let i = 0; i < 22; i++) { const tx = i * 19 + r() * 10, h = 30 + r() * 40; x.fillStyle = ST.tanne || "#132018"; x.beginPath(); x.moveTo(tx, 100 - h); x.lineTo(tx - h * 0.3, 100); x.lineTo(tx + h * 0.3, 100); x.fill(); }
    } else if (ST.horizont === "daecher") {
      for (let i = 0; i < 7; i++) { const bx = i * 60 + r() * 20, bw = 40 + r() * 20, bh = 20 + r() * 20; x.fillStyle = "#1f1716"; x.fillRect(bx, 100 - bh, bw, bh); x.fillStyle = "#3a1f1c"; x.beginPath(); x.moveTo(bx - 4, 100 - bh); x.lineTo(bx + bw / 2, 100 - bh - 16); x.lineTo(bx + bw + 4, 100 - bh); x.fill(); x.fillStyle = "rgba(224,160,70,.5)"; x.fillRect(bx + bw * 0.3, 100 - bh + 6, 5, 6); }
    } else if (ST.horizont === "turm") {
      x.fillStyle = "#1c1b24"; x.fillRect(300, 10, 46, 90); for (let i = 0; i < 4; i++) x.fillRect(298 + i * 13, 2, 8, 10);
      x.fillStyle = "rgba(224,160,70,.6)"; x.fillRect(318, 40, 6, 10);
      x.fillStyle = "#16151c"; x.fillRect(0, 76, W, 24);
    } else if (ST.horizont === "hoehle") {
      x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, 0, W, 100);
      x.fillStyle = F.boden[1];
      x.beginPath(); x.moveTo(0, 0); for (let i = 0; i <= 20; i++) x.lineTo(i * 20, 10 + r() * 18 + (i % 3 === 0 ? 18 : 0)); x.lineTo(W, 0); x.fill();
      if (ST.glut) { gr = x.createLinearGradient(0, 60, 0, 100); gr.addColorStop(0, "rgba(224,96,42,0)"); gr.addColorStop(1, "rgba(224,96,42,.35)"); x.fillStyle = gr; x.fillRect(0, 60, W, 40); }
    } else if (ST.horizont === "halle") {
      // Themberchauds Halle: glühende Rückwand, Pfeiler, der Drache schaut über den Rand
      x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(0, 0, W, 100);
      gr = x.createLinearGradient(0, 40, 0, 100); gr.addColorStop(0, "rgba(255,90,30,0)"); gr.addColorStop(1, "rgba(255,90,30,.4)"); x.fillStyle = gr; x.fillRect(0, 40, W, 60);
      for (const px of [26, 112, 288, 374]) { x.fillStyle = "#1e0e0a"; x.fillRect(px - 9, 0, 18, 100); x.fillStyle = "rgba(255,120,50,.18)"; x.fillRect(px + 6, 0, 3, 100); x.fillStyle = "#2a140e"; x.fillRect(px - 12, 0, 24, 6); }
      x.fillStyle = "#c98a2a"; x.beginPath(); x.moveTo(250, 100); x.quadraticCurveTo(300, 74, 352, 100); x.fill();
      x.fillStyle = "rgba(255,211,77,.55)"; for (let i = 0; i < 16; i++) x.fillRect(262 + r() * 80, 88 + r() * 11, 2, 1.2);
      if (DRACHE.complete && DRACHE.naturalWidth) { const dh = 104, dw = dh * DRACHE.naturalWidth / DRACHE.naturalHeight; x.save(); x.globalAlpha = 0.92; x.drawImage(DRACHE, W - dw - 4, 100 - dh + 6, dw, dh); x.restore(); }
    } else if (ST.horizont === "ufer") {
      x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(0, 0, W, 100);
      x.fillStyle = "#0a1016"; x.beginPath(); x.moveTo(0, 0); for (let i = 0; i <= 20; i++) x.lineTo(i * 20, 8 + r() * 14); x.lineTo(W, 0); x.fill();
    }
    for (let i = 0; i < 30; i++) { x.fillStyle = "rgba(235,226,204," + (0.05 + r() * 0.2) + ")"; x.fillRect(r() * W, r() * 70, 1, 1); }
    // Boden / Wasser
    gr = x.createLinearGradient(0, 100, 0, H);
    gr.addColorStop(0, F.boden[0]); gr.addColorStop(1, F.boden[1]);
    x.fillStyle = gr; x.fillRect(0, 100, W, H - 100);
    // Grasnarbe / Kante
    x.fillStyle = F.gras; x.fillRect(0, 96, W, 10);
    if (!F.wasser) for (let i = 0; i < 90; i++) { x.strokeStyle = F.akzent; x.globalAlpha = 0.35; x.lineWidth = 1; const gx = r() * W; x.beginPath(); x.moveTo(gx, 104); x.lineTo(gx + r() * 4 - 2, 96 - r() * 6); x.stroke(); }
    x.globalAlpha = 1;
    // Erdschichten: abwechselnd getönte Bänder mit Kieseln an den Grenzen
    for (let s = 0; s < 6; s++) {
      const y0 = 140 + s * 62, oben = [], unten = [];
      for (let i = 0; i <= 20; i++) { oben.push([i * 20, y0 + Math.sin(i * 0.9 + s) * 7 + r() * 4]); unten.push([i * 20, y0 + 62 + Math.sin(i * 0.9 + s + 1) * 7 + r() * 4]); }
      x.fillStyle = s % 2 ? "rgba(0,0,0,.12)" : "rgba(235,226,204,.035)";
      x.beginPath(); oben.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); for (let i = unten.length - 1; i >= 0; i--) x.lineTo(unten[i][0], unten[i][1]); x.closePath(); x.fill();
      x.strokeStyle = "rgba(0,0,0,.24)"; x.lineWidth = 1.6; x.beginPath(); oben.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke();
      x.strokeStyle = "rgba(235,226,204,.06)"; x.lineWidth = 1; x.beginPath(); oben.forEach((q, i) => i ? x.lineTo(q[0], q[1] + 2) : x.moveTo(q[0], q[1] + 2)); x.stroke();
      for (let kk = 0; kk < 16; kk++) { const q = oben[Math.floor(r() * oben.length)], rr = 1.4 + r() * 3.2, ox = q[0] + r() * 18 - 9; x.fillStyle = "rgba(0,0,0,.32)"; oval(x, ox + 0.8, q[1] + 1.6, rr, rr * 0.7); x.fillStyle = F.stein; oval(x, ox, q[1], rr, rr * 0.7, r()); x.fillStyle = "rgba(235,226,204,.14)"; oval(x, ox - rr * 0.3, q[1] - rr * 0.3, rr * 0.4, rr * 0.25); }
    }
    // feine Haarwurzeln unter der Grasnarbe
    if (!F.wasser) for (let i = 0; i < 26; i++) { x.strokeStyle = "rgba(70,52,34," + (0.35 + r() * 0.3) + ")"; x.lineWidth = 0.6 + r() * 1.2; x.beginPath(); let px = r() * W, py = 104; x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += r() * 10 - 5; py += 5 + r() * 9; x.lineTo(px, py); } x.stroke(); }
    // Körnung
    for (let i = 0; i < 500; i++) { x.fillStyle = r() < 0.5 ? "rgba(0,0,0,.18)" : "rgba(235,226,204,.04)"; x.fillRect(r() * W, 106 + r() * (H - 106), 1 + r() * 2, 1 + r() * 2); }
    // Gebietsdetails im Boden
    if (ST.wurzeln) {
      for (let i = 0; i < 9; i++) { x.strokeStyle = ST.knochen ? "rgba(90,70,48,.55)" : "rgba(80,62,40,.5)"; x.lineWidth = 2 + r() * 3; x.beginPath(); let px = r() * W, py = 104; x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += r() * 30 - 15; py += 14 + r() * 18; x.lineTo(px, py); } x.stroke(); }
      if (ST.knochen) for (let i = 0; i < 5; i++) { x.fillStyle = "rgba(235,226,204,.12)"; const bx = r() * W, by = 200 + r() * 250; oval(x, bx, by, 6, 3, r()); oval(x, bx + 6, by + 2, 3, 3); }
    }
    if (F.mauer) { // Kellermauern
      x.strokeStyle = "rgba(0,0,0,.28)"; x.lineWidth = 1.5;
      for (let y = 120; y < H; y += 22) for (let xx = ((y / 22) % 2) * 20; xx < W; xx += 40) { if (r() < 0.55) x.strokeRect(xx + 1, y + 1, 38, 20); }
    }
    if (F.schienen) { // Stollen mit Schienen
      x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, 248, W, 40);
      x.strokeStyle = "#5a4430"; x.lineWidth = 3; for (let i = 0; i < W; i += 26) { x.beginPath(); x.moveTo(i, 288); x.lineTo(i + 14, 288); x.stroke(); }
      x.strokeStyle = "#8a8070"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 284); x.lineTo(W, 284); x.stroke();
      x.strokeStyle = "#4a3424"; x.lineWidth = 6; for (let i = 30; i < W; i += 120) { x.beginPath(); x.moveTo(i, 248); x.lineTo(i, 290); x.stroke(); }
      for (let i = 0; i < 40; i++) { x.fillStyle = "rgba(224,160,70," + (0.15 + r() * 0.3) + ")"; x.fillRect(r() * W, 110 + r() * 380, 2, 2); }
    }
    if (F.pilze) { // leuchtende Pilze und Spinnweben
      for (let i = 0; i < 14; i++) { const px = r() * W, py = 120 + r() * 360; x.fillStyle = "rgba(196,154,224,.25)"; kreis(x, px, py, 7); x.fillStyle = "rgba(196,154,224,.6)"; oval(x, px, py - 2, 4, 2.5); x.fillRect(px - 0.8, py - 1, 1.6, 4); }
      x.strokeStyle = "rgba(235,226,204,.12)"; x.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) { const cx = r() * W, cy = 130 + r() * 300; for (let a = 0; a < 8; a++) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a * 0.8) * 30, cy + Math.sin(a * 0.8) * 30); x.stroke(); } for (let rr = 8; rr < 30; rr += 7) { x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke(); } }
    }
    if (F.wasser) { // Wasser mit Lichtstrahlen
      gr = x.createLinearGradient(0, 100, 0, H); gr.addColorStop(0, "rgba(74,160,176,.25)"); gr.addColorStop(1, "rgba(6,16,26,0)"); x.fillStyle = gr; x.fillRect(0, 100, W, H - 100);
      for (let i = 0; i < 5; i++) { x.fillStyle = "rgba(159,214,236,.05)"; x.beginPath(); const sx = r() * W; x.moveTo(sx, 100); x.lineTo(sx + 30, 100); x.lineTo(sx - 40 + r() * 80, H); x.lineTo(sx - 80 + r() * 60, H); x.fill(); }
      for (let i = 0; i < 12; i++) { x.strokeStyle = "rgba(74,120,90,.5)"; x.lineWidth = 2; const sx = r() * W; x.beginPath(); x.moveTo(sx, H); for (let j = 0; j < 5; j++) x.quadraticCurveTo(sx + (j % 2 ? 8 : -8), H - j * 18 - 9, sx, H - (j + 1) * 18); x.stroke(); }
      x.fillStyle = "rgba(159,214,236,.35)"; x.fillRect(0, 98, W, 3);
    }
    if (F.lava) { // Glutadern
      for (let i = 0; i < 6; i++) { x.strokeStyle = "rgba(255,120,40,.45)"; x.lineWidth = 2; x.shadowColor = "#ff6a2a"; x.shadowBlur = 6; x.beginPath(); let px = r() * W, py = 140 + r() * 300; x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += r() * 40 - 20; py += r() * 30 - 10; x.lineTo(px, py); } x.stroke(); }
      x.shadowBlur = 0;
    }
    if (ST.lavarand) { // Lavaströme an den Rändern der Halle
      [[0, 1], [W, -1]].forEach(([rx, s2]) => { gr = x.createLinearGradient(rx, 0, rx + s2 * 16, 0); gr.addColorStop(0, "rgba(255,150,60,.9)"); gr.addColorStop(0.45, "rgba(224,80,30,.7)"); gr.addColorStop(1, "rgba(120,30,10,0)"); x.fillStyle = gr; x.fillRect(Math.min(rx, rx + s2 * 16), 104, 16, H - 104); });
    }
    // dunkle Vignette
    gr = x.createRadialGradient(W / 2, 290, 120, W / 2, 290, 340); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.45)");
    x.fillStyle = gr; x.fillRect(0, 100, W, H - 100);
    hgBild = c;
  }

  /* --- Hintergrund der Abwehr: Karte von oben mit Weg --- */
  function hintergrundAbwehr(g, P) {
    hgSchluessel = "abwehr" + g + ":" + S.lv;
    const G = GEB[g], F = G.f, ST = G.stil, [c, x] = neueLeinwand(), r = lcg(31 + g * 13);
    const hoehle = ST.horizont === "hoehle", plaetze = (S.A && S.A.plaetze) || [], L = [];
    let gr = x.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, F.gras); gr.addColorStop(1, F.boden[1]);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    // weiche Bodenflecken
    for (let i = 0; i < 26; i++) { const px = r() * W, py = r() * H, rr = 20 + r() * 50; const g2 = x.createRadialGradient(px, py, 2, px, py, rr); g2.addColorStop(0, r() < 0.5 ? "rgba(0,0,0,.16)" : "rgba(235,226,204,.05)"); g2.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g2; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
    for (let i = 0; i < 900; i++) { x.fillStyle = r() < 0.5 ? "rgba(0,0,0,.14)" : "rgba(235,226,204,.035)"; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    const frei = (px, py, rand) => abstZumPfad(P, px, py) > (rand || 24) && abst(px, py, HORT.x, HORT.y) > 48 && plaetze.every(q => abst(q.x, q.y, px, py) > 22);
    const deko = (n, fn, rand) => { for (let i = 0; i < n; i++) { const px = r() * W, py = 24 + r() * (LEISTE - 30); if (frei(px, py, rand)) fn(px, py); } };
    // Gras und Blumen (nicht in Höhlen)
    if (!hoehle && !F.wasser) {
      deko(170, (px, py) => { x.strokeStyle = r() < 0.5 ? F.akzent : "rgba(111,154,58,.5)"; x.globalAlpha = 0.45 + r() * 0.3; x.lineWidth = 1; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(px + k * 1.5, py); x.lineTo(px + k * 1.5 + (r() - 0.5) * 4, py - 3 - r() * 5); x.stroke(); } x.globalAlpha = 1; }, 18);
      const blumen = ST.knochen ? ["#8a7a9a", "#6a7a5a"] : ["#e8d8a8", "#c4564a", "#e0a046", "#b8a8e0"];
      deko(45, (px, py) => { x.fillStyle = zufallR(r, blumen); kreis(x, px, py, 1.4); x.fillStyle = "rgba(255,240,200,.6)"; kreis(x, px, py, 0.5); }, 18);
    }
    if (hoehle) {
      x.strokeStyle = "rgba(0,0,0,.3)"; x.lineWidth = 1.2;
      for (let i = 0; i < 26; i++) { x.beginPath(); let px = r() * W, py = r() * LEISTE; x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (r() - 0.5) * 28; py += (r() - 0.5) * 20; x.lineTo(px, py); } x.stroke(); }
    }
    if (F.wasser) {
      [[70, 90, 90, 50], [340, 330, 80, 60], [60, 360, 50, 40]].forEach(([tx, ty, rx, ry]) => {
        const tg = x.createRadialGradient(tx, ty, 4, tx, ty, Math.max(rx, ry)); tg.addColorStop(0, "rgba(40,110,130,.55)"); tg.addColorStop(0.75, "rgba(30,90,110,.35)"); tg.addColorStop(1, "rgba(20,60,80,0)");
        x.fillStyle = tg; oval(x, tx, ty, rx, ry);
        x.strokeStyle = "rgba(159,214,236,.18)"; x.lineWidth = 1.2; x.beginPath(); x.ellipse(tx, ty, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2); x.stroke();
        if (S.A) S.A.teiche.push({ x: tx, y: ty, rx, ry });
      });
      x.strokeStyle = "rgba(159,214,236,.2)"; x.lineWidth = 1; for (let i = 0; i < 26; i++) { const wx = r() * W, wy = r() * LEISTE; x.beginPath(); x.arc(wx, wy, 6 + r() * 6, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
      deko(30, (px, py) => { x.strokeStyle = "rgba(74,120,90,.55)"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 3, py - 6, px - 1, py - 11); x.stroke(); }, 20);
    }
    if (F.lava) { x.strokeStyle = "rgba(255,110,40,.55)"; x.lineWidth = 3; x.shadowColor = "#ff6a2a"; x.shadowBlur = 10; for (let i = 0; i < 5; i++) { x.beginPath(); let px = r() * W, py = r() * LEISTE; x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += r() * 50 - 25; py += r() * 50 - 25; x.lineTo(px, py); if (j % 2) L.push({ x: px, y: py, r: 42, f: "rgba(255,110,40,.13)", fl: 1 }); } x.stroke(); } x.shadowBlur = 0; }
    if (ST.lavarand) { // Lavarahmen um die ganze Halle
      x.save(); x.shadowColor = "#ff6a2a"; x.shadowBlur = 12; x.strokeStyle = "rgba(255,120,40,.75)"; x.lineWidth = 7; x.strokeRect(3.5, 3.5, W - 7, LEISTE - 7);
      x.shadowBlur = 0; x.strokeStyle = "rgba(255,210,120,.5)"; x.lineWidth = 1.5; x.strokeRect(3.5, 3.5, W - 7, LEISTE - 7); x.restore();
      for (let lx = 30; lx < W; lx += 90) { L.push({ x: lx, y: 6, r: 40, f: "rgba(255,110,40,.12)", fl: 1 }); L.push({ x: lx, y: LEISTE - 6, r: 40, f: "rgba(255,110,40,.12)", fl: 1 }); }
      for (let ly = 60; ly < LEISTE; ly += 110) { L.push({ x: 6, y: ly, r: 40, f: "rgba(255,110,40,.12)", fl: 1 }); L.push({ x: W - 6, y: ly, r: 40, f: "rgba(255,110,40,.12)", fl: 1 }); }
    }
    if (F.pilze) deko(22, (px, py) => { if (L.length < 40 && (px * 7 + py) % 3 < 1.4) L.push({ x: px, y: py, r: 30, f: "rgba(196,154,224,.11)" }); const g3 = x.createRadialGradient(px, py, 1, px, py, 12); g3.addColorStop(0, "rgba(196,154,224,.35)"); g3.addColorStop(1, "rgba(196,154,224,0)"); x.fillStyle = g3; kreis(x, px, py, 12); x.fillStyle = "#e8dcd0"; x.fillRect(px - 0.8, py - 1, 1.6, 4); x.fillStyle = "rgba(196,154,224,.85)"; oval(x, px, py - 1.5, 3.5, 2.2); });
    if (F.schienen) { x.strokeStyle = "rgba(138,128,112,.45)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 60); x.lineTo(W, 120); x.moveTo(0, 67); x.lineTo(W, 127); x.stroke(); x.strokeStyle = "rgba(90,68,48,.6)"; x.lineWidth = 2.5; for (let xx = 0; xx < W; xx += 14) { const yy = 60 + xx * 60 / W; x.beginPath(); x.moveTo(xx, yy - 2); x.lineTo(xx + 1, yy + 9); x.stroke(); } }
    // Weg: Schatten, Grund, Staub, Spurrillen, Randsteine
    const weg = (breite, farbe) => { x.strokeStyle = farbe; x.lineWidth = breite; x.lineJoin = "round"; x.lineCap = "round"; x.beginPath(); P.p.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); x.stroke(); };
    weg(44, "rgba(0,0,0,.34)"); weg(35, "rgba(235,226,204,.16)"); weg(32, F.weg); weg(24, F.wasser ? "#33464f" : "rgba(235,226,204,.08)"); weg(10, F.wasser ? "rgba(159,214,236,.08)" : "rgba(235,226,204,.05)");
    const versatz = (d, fn) => { for (let s0 = 4; s0 < P.gesamt - 4; s0 += 3) { const a = pfadPunkt(P, s0), b = pfadPunkt(P, s0 + 2), w = Math.atan2(b.y - a.y, b.x - a.x); fn(a.x + Math.cos(w + Math.PI / 2) * d, a.y + Math.sin(w + Math.PI / 2) * d, s0, w); } };
    if (!F.wasser) { x.fillStyle = "rgba(0,0,0,.14)"; versatz(6, (px, py) => x.fillRect(px - 1, py - 1, 2, 2)); versatz(-6, (px, py) => x.fillRect(px - 1, py - 1, 2, 2)); }
    [-16.5, 16.5].forEach(d => versatz(d, (px, py, s0) => { if (s0 % 12 > 2.9) return; const rr = 2.2 + r() * 1.8; x.fillStyle = "rgba(0,0,0,.3)"; oval(x, px + 0.8, py + 1, rr, rr * 0.75); x.fillStyle = F.stein; oval(x, px, py, rr, rr * 0.75); x.fillStyle = "rgba(235,226,204,.14)"; oval(x, px - rr * 0.3, py - rr * 0.3, rr * 0.45, rr * 0.3); }));
    for (let i = 0; i < 120; i++) { const s0 = r() * P.gesamt, q = pfadPunkt(P, s0); x.fillStyle = r() < 0.5 ? "rgba(0,0,0,.22)" : "rgba(235,226,204,.07)"; x.fillRect(q.x + r() * 18 - 9, q.y + r() * 18 - 9, 2, 2); }
    if (F.mauer) { // Kopfsteinpflaster
      [-9.5, -3.2, 3.2, 9.5].forEach((d, j) => versatz(d, (px, py, s0, w) => { if ((s0 + j * 3) % 6 > 2.9) return; x.save(); x.translate(px, py); x.rotate(w); x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(-2.6, -2.2, 5.6, 4.8); x.fillStyle = r() < 0.5 ? F.stein : "rgba(140,130,118,.85)"; x.fillRect(-3, -2.6, 5.4, 4.6); x.fillStyle = "rgba(235,226,204,.12)"; x.fillRect(-3, -2.6, 5.4, 1.2); x.restore(); }));
    } else if (F.wasser) { // Holzsteg
      versatz(0, (px, py, s0, w) => { if (s0 % 6 > 2.9) return; x.save(); x.translate(px, py); x.rotate(w); x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(-2, -14, 5, 29); x.fillStyle = (Math.floor(s0 / 6) % 3) ? "#5a4632" : "#6a5440"; x.fillRect(-2.5, -15, 4.6, 29); x.fillStyle = "rgba(235,226,204,.12)"; x.fillRect(-2.5, -15, 1.1, 29); x.fillStyle = "#2a2018"; kreis(x, -0.2, -12, 0.7); kreis(x, -0.2, 12, 0.7); x.restore(); });
    } else if (hoehle) { // Geröll
      for (let i = 0; i < 70; i++) { const q = pfadPunkt(P, r() * P.gesamt), rr = 1.2 + r() * 2.4, ox = r() * 22 - 11, oy = r() * 22 - 11; x.fillStyle = "rgba(0,0,0,.3)"; oval(x, q.x + ox + 0.6, q.y + oy + 0.8, rr, rr * 0.7); x.fillStyle = F.stein; oval(x, q.x + ox, q.y + oy, rr, rr * 0.7); }
    } else { // Fußspuren im Waldboden
      versatz(0, (px, py, s0, w) => { if (s0 % 18 > 2.9) return; const seite = Math.floor(s0 / 18) % 2 ? 3 : -3; x.save(); x.translate(px + Math.cos(w + Math.PI / 2) * seite, py + Math.sin(w + Math.PI / 2) * seite); x.rotate(w); x.fillStyle = "rgba(0,0,0,.2)"; oval(x, 0, 0, 2.6, 1.4); oval(x, 3.2, 0, 1.2, 1.1); x.restore(); });
    }
    // Laternen, Kristalle oder Glutbecken am Wegrand – geben dem Weg Licht
    const k0 = G.k, lat = k0 === "schmiede" ? "kristall" : k0 === "unterreich" ? "pilzkristall" : k0 === "gracklstugh" || k0 === "hort" ? "glut" : "laterne";
    for (let s0 = 70, i = 0; s0 < P.gesamt - 40; s0 += 135, i++) {
      const a = pfadPunkt(P, s0), b = pfadPunkt(P, s0 + 2), w = Math.atan2(b.y - a.y, b.x - a.x), sd = i % 2 ? 1 : -1;
      const lx = a.x + Math.cos(w + Math.PI / 2) * 25 * sd, ly = a.y + Math.sin(w + Math.PI / 2) * 25 * sd;
      if (lx < 12 || lx > W - 12 || ly < 34 || ly > LEISTE - 10 || abst(lx, ly, HORT.x, HORT.y) < 46 || plaetze.some(q => abst(q.x, q.y, lx, ly) < 22)) continue;
      x.fillStyle = "rgba(0,0,0,.35)"; oval(x, lx + 2, ly + 3, 6, 2.6);
      if (lat === "laterne") {
        x.fillStyle = "#3a2d20"; x.fillRect(lx - 1.2, ly - 16, 2.4, 18); x.fillRect(lx - 1.2, ly - 16, 6, 1.6);
        const gl = x.createRadialGradient(lx + 4.5, ly - 11, 0.5, lx + 4.5, ly - 11, 9); gl.addColorStop(0, "rgba(255,210,120,.9)"); gl.addColorStop(1, "rgba(255,190,90,0)"); x.fillStyle = gl; kreis(x, lx + 4.5, ly - 11, 9);
        x.fillStyle = "#2a2018"; x.fillRect(lx + 2.4, ly - 14.5, 4.2, 6); x.fillStyle = "#ffd27a"; x.fillRect(lx + 3.1, ly - 13.6, 2.8, 4.2);
        L.push({ x: lx + 4.5, y: ly - 11, r: 64, f: "rgba(255,190,90,.13)", fl: 1 });
      } else if (lat === "glut") {
        x.fillStyle = "#3a3230"; x.beginPath(); x.moveTo(lx - 6, ly - 6); x.lineTo(lx + 6, ly - 6); x.lineTo(lx + 3, ly + 1); x.lineTo(lx - 3, ly + 1); x.fill();
        x.fillStyle = "#ff8a3a"; oval(x, lx, ly - 6, 5.5, 2); x.fillStyle = "#ffd27a"; oval(x, lx, ly - 6.5, 3, 1.2);
        L.push({ x: lx, y: ly - 8, r: 60, f: "rgba(255,120,50,.16)", fl: 1 });
      } else {
        const kf = lat === "kristall" ? ["#7fd6e0", "#cff4f8", "rgba(127,214,224,.14)"] : ["#b48ad8", "#efe0ff", "rgba(196,154,224,.14)"];
        [[-3.5, -0.4, 9], [0, 0, 13], [3.5, 0.45, 8]].forEach(([dx, rw, hh]) => { x.save(); x.translate(lx + dx, ly); x.rotate(rw); x.fillStyle = kf[0]; x.beginPath(); x.moveTo(-2.2, 0); x.lineTo(-2.2, -hh + 2); x.lineTo(0, -hh); x.lineTo(2.2, -hh + 2); x.lineTo(2.2, 0); x.fill(); x.fillStyle = kf[1]; x.fillRect(-0.6, -hh + 2, 1.1, hh - 3); x.restore(); });
        L.push({ x: lx, y: ly - 6, r: 56, f: kf[2] });
      }
    }
    // Bäume, Häuser, Felsen – nach dem Weg, damit sie darüber ragen dürfen
    if (ST.deko === "baeume") deko(30, (px, py) => {
      const h = 13 + r() * 11, d1 = ST.knochen ? "#1a2618" : "#1c3020", d2 = ST.knochen ? "#243520" : "#284a2a", d3 = ST.knochen ? "#30442a" : "#3a6236";
      x.fillStyle = "rgba(0,0,0,.32)"; oval(x, px + 5, py + 6, h * 0.85, h * 0.55);
      x.fillStyle = d1; kreis(x, px, py, h * 0.8); kreis(x, px - h * 0.45, py + h * 0.15, h * 0.5); kreis(x, px + h * 0.42, py + h * 0.2, h * 0.5);
      x.fillStyle = d2; kreis(x, px - h * 0.12, py - h * 0.12, h * 0.6);
      x.fillStyle = d3; kreis(x, px - h * 0.25, py - h * 0.3, h * 0.32);
      if (ST.knochen) { x.strokeStyle = "rgba(20,14,10,.6)"; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + h * 0.6, py - h * 0.7); x.stroke(); }
    }, 30);
    if (ST.deko === "haeuser") deko(9, (px, py) => {
      x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(px - 13, py - 8, 32, 26);
      x.fillStyle = "#4a2a22"; x.fillRect(px - 16, py - 12, 32, 24);
      x.fillStyle = "#5e342a"; x.beginPath(); x.moveTo(px - 16, py - 12); x.lineTo(px + 16, py - 12); x.lineTo(px + 16, py); x.lineTo(px - 16, py); x.fill();
      x.strokeStyle = "#7a4436"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px - 16, py); x.lineTo(px + 16, py); x.stroke();
      x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = 0.8; for (let k = -12; k < 16; k += 5) { x.beginPath(); x.moveTo(px + k, py - 12); x.lineTo(px + k, py + 12); x.stroke(); }
      x.fillStyle = "#3a3632"; x.fillRect(px + 7, py - 15, 5, 6);
      x.fillStyle = "rgba(255,200,110,.5)"; kreis(x, px - 9, py + 6, 1.6);
    }, 34);
    if (F.mauer || ST.deko === "steine") deko(24, (px, py) => { const rr = 4 + r() * 7; x.fillStyle = "rgba(0,0,0,.3)"; oval(x, px + 2, py + 2, rr, rr * 0.75); x.fillStyle = F.stein; oval(x, px, py, rr, rr * 0.75, r()); x.fillStyle = "rgba(235,226,204,.12)"; oval(x, px - rr * 0.3, py - rr * 0.3, rr * 0.5, rr * 0.3); }, 22);
    // Steinplatten der Bauplätze
    plaetze.forEach(q => {
      x.fillStyle = "rgba(0,0,0,.22)"; oval(x, q.x + 1.5, q.y + 6, 19, 8);
      x.fillStyle = "rgba(60,48,34,.45)"; oval(x, q.x, q.y + 4, 17, 8);
      x.globalAlpha = 0.55; for (let k = 0; k < 9; k++) { const w = k / 9 * Math.PI * 2, sx = q.x + Math.cos(w) * 16, sy = q.y + 4 + Math.sin(w) * 7.5; x.fillStyle = k % 2 ? F.stein : "rgba(150,140,124,.9)"; oval(x, sx, sy, 3.4, 2.4); } x.globalAlpha = 1;
      x.fillStyle = "rgba(235,226,204,.06)"; oval(x, q.x - 3, q.y + 2, 8, 3);
    });
    // Eingang mit Fackeln
    const st = P.p[0];
    x.fillStyle = "rgba(0,0,0,.6)"; oval(x, st.x, st.y - 4, 26, 14);
    [-22, 22].forEach(d => { L.push({ x: st.x + d, y: st.y - 16, r: 58, f: "rgba(255,170,80,.16)", fl: 1 }); x.fillStyle = "#3a2d20"; x.fillRect(st.x + d - 1.5, st.y - 14, 3, 14); const gl = x.createRadialGradient(st.x + d, st.y - 16, 1, st.x + d, st.y - 16, 22); gl.addColorStop(0, "rgba(255,190,90,.5)"); gl.addColorStop(1, "rgba(255,190,90,0)"); x.fillStyle = gl; kreis(x, st.x + d, st.y - 16, 22); x.fillStyle = "#ffcf7a"; kreis(x, st.x + d, st.y - 16, 2.4); });
    // warmes Licht um den Hort, Vignette
    let hl = x.createRadialGradient(HORT.x, HORT.y, 10, HORT.x, HORT.y, 120); hl.addColorStop(0, "rgba(255,200,110,.18)"); hl.addColorStop(1, "rgba(255,200,110,0)");
    x.fillStyle = hl; x.fillRect(0, 0, W, H);
    gr = x.createRadialGradient(W / 2, 240, 150, W / 2, 240, 340); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.32)");
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    if (S.A) S.A.licht = L;
    hgBild = c;
  }
  const zufallR = (r, l) => l[Math.floor(r() * l.length)];

  /* ---------- Licht: Dunkelheit mit Lichtinseln (halbe Auflösung) + farbiger Schein ---------- */
  const LF = 0.4;
  const dunkelC = document.createElement("canvas"), dunkelX = dunkelC.getContext("2d");
  const scheinC = document.createElement("canvas"), scheinX = scheinC.getContext("2d");
  dunkelC.width = scheinC.width = Math.round(W * LF); dunkelC.height = scheinC.height = Math.round(LEISTE * LF);
  const DUNKEL = { wald: 0.3, phandalin: 0.26, wachturm: 0.36, schmiede: 0.4, donnerbaum: 0.36, unterreich: 0.48, see: 0.38, gracklstugh: 0.38 };
  /* Lichtbilder einmal vorberechnen (radiale Verläufe sind teuer) */
  const SPRITE = 64;
  function spriteBauen(farbe, innen) {
    const c = document.createElement("canvas"); c.width = c.height = SPRITE;
    const x = c.getContext("2d"), g = x.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    g.addColorStop(0, "rgba(" + farbe + ",1)"); if (innen) g.addColorStop(0.55, "rgba(" + farbe + ",.6)"); g.addColorStop(1, "rgba(" + farbe + ",0)");
    x.fillStyle = g; x.fillRect(0, 0, SPRITE, SPRITE); return c;
  }
  const lochSprite = spriteBauen("0,0,0", true), farbSprites = {};
  const farbeTeilen = f => { const m = /rgba?\(([^,]+),([^,]+),([^,]+),?([^)]*)\)/.exec(f.replace(/\s/g, "")); return m ? [m[1] + "," + m[2] + "," + m[3], m[4] === "" ? 1 : parseFloat(m[4])] : ["255,255,255", 0.1]; };
  function lichtMalen(x, quellen, dunkel, zeit) {
    if (lichtAus) return;
    const D = dunkelX, Sx = scheinX;
    D.setTransform(1, 0, 0, 1, 0, 0); D.globalCompositeOperation = "source-over"; D.globalAlpha = 1; D.clearRect(0, 0, dunkelC.width, dunkelC.height);
    D.fillStyle = "rgba(5,4,12," + dunkel + ")"; D.fillRect(0, 0, dunkelC.width, dunkelC.height);
    D.setTransform(LF, 0, 0, LF, 0, 0); D.globalCompositeOperation = "destination-out";
    Sx.setTransform(1, 0, 0, 1, 0, 0); Sx.globalCompositeOperation = "source-over"; Sx.globalAlpha = 1; Sx.clearRect(0, 0, scheinC.width, scheinC.height);
    Sx.setTransform(LF, 0, 0, LF, 0, 0); Sx.globalCompositeOperation = "lighter";
    let farbig = false;
    quellen.forEach(q => {
      const rr = q.r * (q.fl ? 1 + Math.sin(zeit * 9 + q.x * 0.3) * 0.04 + Math.sin(zeit * 23 + q.y) * 0.02 : 1);
      D.globalAlpha = q.a == null ? 1 : q.a; D.drawImage(lochSprite, q.x - rr, q.y - rr, rr * 2, rr * 2);
      if (q.f) {
        const [rgb, al] = farbeTeilen(q.f); if (al <= 0.005) return;
        const sp = farbSprites[rgb] || (farbSprites[rgb] = spriteBauen(rgb, false)), r2 = rr * 0.75;
        Sx.globalAlpha = Math.min(1, al); Sx.drawImage(sp, q.x - r2, q.y - r2, r2 * 2, r2 * 2); farbig = true;
      }
    });
    x.save();
    x.drawImage(dunkelC, 0, 0, W, LEISTE);
    if (farbig) { x.globalCompositeOperation = "lighter"; x.drawImage(scheinC, 0, 0, W, LEISTE); }
    x.restore();
  }
  function lichtAbwehr(x, A, zeit) {
    const Q = (A.licht || []).slice();
    Q.push({ x: HORT.x, y: HORT.y - 10, r: 145, f: "rgba(255,190,90,.18)", fl: 1 });
    Q.push({ x: W * 0.3, y: 120, r: 210, a: 0.35, f: "rgba(170,190,230,.04)" }); // Mondlicht
    A.plaetze.forEach((p, i) => {
      const T = p.turm;
      if (!T) { if (A.wahl === i) Q.push({ x: p.x, y: p.y, r: 46, f: "rgba(224,160,70,.12)" }); return; }
      if (T.k === "eis" && !T.tier) Q.push({ x: p.x, y: p.y - 8, r: 50, f: "rgba(159,214,236," + (0.12 + (T.anim || 0) * 0.5) + ")" });
      else if (T.k === "blitz" && !T.tier) Q.push({ x: p.x, y: p.y - 22, r: (T.anim || 0) > 0 ? 80 : 40, f: (T.anim || 0) > 0 ? "rgba(243,226,122,.3)" : "rgba(243,226,122,.06)" });
      else if (T.k === "pilz" && !T.tier) Q.push({ x: p.x, y: p.y, r: 44, f: "rgba(196,154,224,.13)" });
      else Q.push({ x: p.x, y: p.y - 4, r: A.wahl === i ? 56 : 42 });
    });
    A.feinde.forEach(e => {
      if (e.beute) Q.push({ x: e.x, y: e.y, r: 26, f: "rgba(255,211,77,.14)" });
      else if (e.d.boss) Q.push({ x: e.x, y: e.y, r: 48, f: e.d.unbesiegbar ? "rgba(196,86,74,.14)" : "rgba(224,160,70,.08)" });
    });
    A.geschosse.forEach(g => {
      if (g.art === "feuerball") Q.push({ x: g.x, y: g.y, r: 70, f: "rgba(255,138,58,.32)" });
      else if (g.art === "gold") Q.push({ x: g.x, y: g.y, r: 30, f: "rgba(255,211,77,.2)" });
      else if (g.art === "splitter") Q.push({ x: g.x, y: g.y, r: 18, f: "rgba(159,214,236,.18)" });
    });
    S.blitze.forEach(b => {
      const a = 1 - b.t / b.dauer;
      if (b.art === "explosion") Q.push({ x: b.x, y: b.y, r: (b.r || 40) * 1.7, f: "rgba(255,150,60," + (0.4 * a) + ")" });
      else if (b.art === "blitz") Q.push({ x: b.x2, y: b.y2, r: 46, f: "rgba(243,226,122," + (0.3 * a) + ")" });
      else if (b.art === "aufwertung") Q.push({ x: b.x, y: b.y - 10, r: 70, f: "rgba(255,211,77," + (0.25 * a) + ")" });
    });
    if (A.baer) Q.push({ x: A.baer.x, y: A.baer.y, r: 60, f: "rgba(196,86,74,.12)" });
    lichtMalen(x, Q, DUNKEL[GEB[A.g].k] || 0.38, zeit);
  }
  function lichtRaub(x, R, zeit) {
    const sp = hakenSpitze(R.haken), Q = [
      { x: W / 2, y: 30, r: 230 }, { x: 60, y: 60, r: 120 }, { x: W - 60, y: 60, r: 120 },
      { x: DREH.x, y: 62, r: 110, f: "rgba(207,230,168,.10)" },
      { x: sp.x, y: sp.y, r: 78, f: "rgba(207,230,168,.13)" }
    ];
    R.dinge.forEach(d => { if (SCHEIN_DING[d.typ]) Q.push({ x: d.x, y: d.y, r: 18 + d.r, f: SCHEIN_DING[d.typ] }); });
    const G = GEB[gebietVon(S.lv)];
    if (R.regel === "lavastrom") {
      R.stroeme.forEach(st => { const heiss = st.zustand === "heiss"; for (let lx = 20; lx < W; lx += 60) Q.push({ x: lx, y: st.y, r: heiss ? 70 : 46, f: heiss ? "rgba(255,140,50,.16)" : "rgba(255,110,40,.08)" }); });
      Q.push({ x: R.berg.x, y: R.berg.y - 24, r: 110, f: "rgba(255,200,90,.12)" });
    }
    if (G.regel === "dunkel") return; // das Unterreich hat schon seine eigene Dunkelheit
    lichtMalen(x, Q, G.f.wasser ? 0.42 : 0.38, zeit);
  }
  const SCHEIN_DING = { muenze: "rgba(255,211,77,.10)", beutel: "rgba(255,211,77,.08)", nugget: "rgba(255,211,77,.14)", edelstein: "rgba(200,180,255,.14)", truhe: "rgba(255,211,77,.12)", relikt: "rgba(255,226,140,.18)", res: "rgba(207,230,168,.07)" };
  function glitzern(x, R, zeit) {
    x.save(); x.globalCompositeOperation = "lighter";
    R.dinge.forEach(d => {
      if (!SCHEIN_DING[d.typ] || d.typ === "res") return;
      const ph = (d.seed || 0.5) * 40, tw = Math.sin(zeit * 2.1 + ph);
      if (tw < 0.82) return;
      const k = (tw - 0.82) / 0.18, sx = d.x + ((d.seed || 0.5) - 0.5) * d.r * 1.2, sy = d.y - d.r * 0.45, gr = 2 + k * 5;
      x.fillStyle = "rgba(255,248,220," + k + ")";
      x.beginPath(); x.moveTo(sx, sy - gr); x.lineTo(sx + gr * 0.22, sy - gr * 0.22); x.lineTo(sx + gr, sy); x.lineTo(sx + gr * 0.22, sy + gr * 0.22); x.lineTo(sx, sy + gr); x.lineTo(sx - gr * 0.22, sy + gr * 0.22); x.lineTo(sx - gr, sy); x.lineTo(sx - gr * 0.22, sy - gr * 0.22); x.closePath(); x.fill();
    });
    x.restore();
  }
  function teicheMalen(x, A, zeit) {
    if (!A.teiche || !A.teiche.length) return;
    x.save(); x.lineWidth = 1;
    A.teiche.forEach((t2, i) => {
      for (let k = 0; k < 4; k++) {
        const u = ((zeit * 0.25 + k * 0.25 + i * 0.13) % 1), a = Math.sin(u * Math.PI) * 0.35;
        x.strokeStyle = "rgba(190,230,245," + a + ")";
        x.beginPath(); x.ellipse(t2.x + Math.sin(k * 2.1 + i) * t2.rx * 0.35, t2.y + Math.cos(k * 1.7 + i) * t2.ry * 0.3, t2.rx * 0.18 * (0.4 + u), t2.ry * 0.12 * (0.4 + u), 0, 0, Math.PI * 2); x.stroke();
      }
      const gl = 0.5 + Math.sin(zeit * 1.3 + i) * 0.5;
      x.fillStyle = "rgba(220,245,255," + (0.08 + gl * 0.08) + ")"; oval(x, t2.x - t2.rx * 0.3, t2.y - t2.ry * 0.35, t2.rx * 0.25, t2.ry * 0.08, -0.2);
    });
    x.restore();
  }
  function leisteOben(x) {
    const g = x.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, "rgba(9,8,15,.88)"); g.addColorStop(1, "rgba(9,8,15,.58)");
    x.fillStyle = g; x.fillRect(0, 0, W, 28);
    const l = x.createLinearGradient(0, 0, W, 0); l.addColorStop(0, "rgba(224,160,70,0)"); l.addColorStop(0.5, "rgba(224,160,70,.55)"); l.addColorStop(1, "rgba(224,160,70,0)");
    x.fillStyle = l; x.fillRect(0, 27.5, W, 1);
  }
  function leisteUnten(x) {
    const g = x.createLinearGradient(0, LEISTE, 0, H); g.addColorStop(0, "rgba(14,11,18,.9)"); g.addColorStop(1, "rgba(6,5,10,.96)");
    x.fillStyle = g; x.fillRect(0, LEISTE, W, H - LEISTE);
    const l = x.createLinearGradient(0, 0, W, 0); l.addColorStop(0, "rgba(224,160,70,0)"); l.addColorStop(0.5, "rgba(224,160,70,.55)"); l.addColorStop(1, "rgba(224,160,70,0)");
    x.fillStyle = l; x.fillRect(0, LEISTE, W, 1);
    const s = x.createLinearGradient(0, LEISTE - 14, 0, LEISTE); s.addColorStop(0, "rgba(0,0,0,0)"); s.addColorStop(1, "rgba(0,0,0,.35)");
    x.fillStyle = s; x.fillRect(0, LEISTE - 14, W, 14);
  }
  /* Umgebung: Glühwürmchen, Glut, Nebel, Sporen, Blasen, fallende Blätter */
  function ambientUpdate(A, dt) {
    const art = GEB[A.g].stil.ambient; if (!art || ruhig) return;
    A.ambient = A.ambient || [];
    const ziel = art === "nebel" ? 6 : 26;
    while (A.ambient.length < ziel) {
      const q = { x: Math.random() * W, y: Math.random() * LEISTE, t: Math.random() * 4, ph: Math.random() * 6 };
      if (art === "glut") { q.y = LEISTE + Math.random() * 20; q.vy = -zw(12, 30); q.vx = zw(-6, 6); }
      if (art === "blase") { q.y = LEISTE + Math.random() * 20; q.vy = -zw(8, 18); }
      if (art === "blatt") { q.y = -10 - Math.random() * 40; q.vy = zw(10, 18); q.vx = zw(-8, 8); q.dreh = Math.random() * 6; }
      if (art === "spore") { q.vy = -zw(3, 8); }
      if (art === "nebel") { q.vx = zw(4, 9) * (Math.random() < 0.5 ? -1 : 1); q.r = zw(40, 80); }
      A.ambient.push(q);
    }
    A.ambient.forEach(q => {
      q.t += dt; q.ph += dt;
      if (art === "gluehwurm") { q.x += Math.sin(q.ph * 0.7) * 8 * dt; q.y += Math.cos(q.ph * 0.5) * 6 * dt; }
      else if (art === "glut" || art === "blase" || art === "spore") { q.y += q.vy * dt; q.x += (q.vx || Math.sin(q.ph) * 5) * dt; if (q.y < -10) q.weg = true; }
      else if (art === "blatt") { q.y += q.vy * dt; q.x += (q.vx + Math.sin(q.ph * 1.5) * 12) * dt; q.dreh += dt * 2; if (q.y > LEISTE + 10) q.weg = true; }
      else if (art === "nebel") { q.x += q.vx * dt; if (q.x < -100 || q.x > W + 100) q.weg = true; }
    });
    A.ambient = A.ambient.filter(q => !q.weg);
  }
  function ambientMalen(x, A, zeit) {
    const art = GEB[A.g].stil.ambient; if (!art || !A.ambient) return;
    x.save();
    A.ambient.forEach(q => {
      if (art === "gluehwurm") { const a = 0.35 + Math.sin(q.ph * 3) * 0.35; if (a <= 0) return; const g = x.createRadialGradient(q.x, q.y, 0, q.x, q.y, 6); g.addColorStop(0, "rgba(230,255,140," + a + ")"); g.addColorStop(1, "rgba(230,255,140,0)"); x.fillStyle = g; kreis(x, q.x, q.y, 6); }
      else if (art === "glut") { x.fillStyle = "rgba(255," + (120 + Math.floor(Math.sin(q.ph * 5) * 60)) + ",40," + (0.5 + Math.sin(q.ph * 4) * 0.3) + ")"; kreis(x, q.x, q.y, 1.4); }
      else if (art === "blase") { x.strokeStyle = "rgba(190,230,245,.45)"; x.lineWidth = 0.8; x.beginPath(); x.arc(q.x, q.y, 1.8 + (q.ph % 2), 0, Math.PI * 2); x.stroke(); }
      else if (art === "spore") { x.fillStyle = "rgba(196,154,224," + (0.3 + Math.sin(q.ph * 2) * 0.25) + ")"; kreis(x, q.x, q.y, 1.6); }
      else if (art === "blatt") { x.save(); x.translate(q.x, q.y); x.rotate(q.dreh); x.fillStyle = "rgba(200,120,50,.75)"; oval(x, 0, 0, 3, 1.6); x.restore(); }
      else if (art === "nebel") { const g = x.createRadialGradient(q.x, q.y, 4, q.x, q.y, q.r); g.addColorStop(0, "rgba(200,200,220,.09)"); g.addColorStop(1, "rgba(200,200,220,0)"); x.fillStyle = g; oval(x, q.x, q.y, q.r, q.r * 0.5); }
    });
    x.restore();
  }


  /* --- Echo und seine Gestalten (nach Echos Bild: weißes Gewand, weißes Haar, dunkles Geweih) --- */
  function malEcho(x, cx, cy, s, form, zorn, zeit) {
    x.save(); x.translate(cx, cy); x.scale(s, s);
    const wut = zorn > 70 ? (zorn - 70) / 30 : 0;
    if (wut > 0) { x.save(); x.globalAlpha = 0.35 * wut; x.fillStyle = "#c4564a"; kreis(x, 0, 0, 30 + Math.sin(zeit * 12) * 3); x.restore(); }
    if (form === "rabe") {
      const fl = Math.sin(zeit * 14) * 0.6;
      x.fillStyle = "#14121a";
      x.beginPath(); x.moveTo(-4, -2); x.quadraticCurveTo(-22, -14 - fl * 14, -30, -4 + fl * 10); x.quadraticCurveTo(-18, 0, -4, 6); x.fill();
      x.beginPath(); x.moveTo(4, -2); x.quadraticCurveTo(22, -14 - fl * 14, 30, -4 + fl * 10); x.quadraticCurveTo(18, 0, 4, 6); x.fill();
      oval(x, 0, 2, 7, 11); kreis(x, 0, -10, 6);
      x.fillStyle = "#2a2632"; x.beginPath(); x.moveTo(-5, 12); x.lineTo(0, 20); x.lineTo(5, 12); x.fill();
      x.fillStyle = "#a89f8f"; x.beginPath(); x.moveTo(-2, -9); x.lineTo(0, -1); x.lineTo(2, -9); x.fill();
      x.fillStyle = wut > 0.5 ? "#ff5a4a" : "#e0a046"; kreis(x, -2.5, -12, 1.4); kreis(x, 2.5, -12, 1.4);
    } else if (form === "baer") {
      x.fillStyle = "#4a3424"; oval(x, 0, 6, 20, 17);
      x.fillStyle = "#5e4230"; kreis(x, 0, -12, 13);
      x.fillStyle = "#4a3424"; kreis(x, -10, -22, 5); kreis(x, 10, -22, 5);
      x.fillStyle = "#3a2618"; kreis(x, -10, -22, 2.5); kreis(x, 10, -22, 2.5);
      x.fillStyle = "#a8835c"; oval(x, 0, -7, 6.5, 5);
      x.fillStyle = "#1a1210"; oval(x, 0, -9.5, 2.6, 1.8);
      x.fillStyle = wut > 0.3 ? "#ff5a4a" : "#1a1210"; kreis(x, -5, -15, 1.8); kreis(x, 5, -15, 1.8);
      x.strokeStyle = "#2a1c12"; x.lineWidth = 2; x.beginPath(); x.moveTo(-3, -3); x.quadraticCurveTo(0, -1, 3, -3); x.stroke();
      x.fillStyle = "#4a3424"; oval(x, -15, 18, 7, 5); oval(x, 15, 18, 7, 5);
      // kleines Geweih bleibt – es ist schließlich Echo
      x.strokeStyle = "#2a2018"; x.lineWidth = 2; x.beginPath(); x.moveTo(-6, -24); x.lineTo(-10, -32); x.moveTo(-8, -28); x.lineTo(-13, -29); x.moveTo(6, -24); x.lineTo(10, -32); x.moveTo(8, -28); x.lineTo(13, -29); x.stroke();
    } else if (form === "ratte") {
      x.strokeStyle = "#b08c7a"; x.lineWidth = 2; x.beginPath(); x.moveTo(8, 8); x.quadraticCurveTo(22, 14, 18 + Math.sin(zeit * 6) * 4, 0); x.stroke();
      x.fillStyle = "#6a6460"; oval(x, 0, 4, 11, 8);
      x.fillStyle = "#7a7470"; oval(x, -8, -2, 7, 6);
      x.fillStyle = "#b08c7a"; kreis(x, -6, -8, 3); kreis(x, -12, -6, 2.5); kreis(x, -15, 0, 1.3);
      x.fillStyle = wut > 0.5 ? "#ff5a4a" : "#1a1210"; kreis(x, -10, -3, 1.3);
    } else {
      // Druide: Umhang, Gewand, Haar, Bart, Geweih, Stab
      x.fillStyle = "#cfc6b4";
      x.beginPath(); x.moveTo(-9, -6); x.quadraticCurveTo(-20, 12, -17, 26); x.lineTo(17, 26); x.quadraticCurveTo(20, 12, 9, -6); x.closePath(); x.fill();
      x.fillStyle = "#ebe2cc";
      x.beginPath(); x.moveTo(-7, -6); x.lineTo(-10, 26); x.lineTo(10, 26); x.lineTo(7, -6); x.closePath(); x.fill();
      x.fillStyle = "#5a4430"; x.fillRect(-8, 6, 16, 3.5); x.fillStyle = "#a8a090"; kreis(x, 0, 7.7, 2);
      x.strokeStyle = "rgba(90,80,64,.5)"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, 10); x.lineTo(0, 25); x.stroke();
      // Stab
      x.strokeStyle = "#3a2d20"; x.lineWidth = 2.2; x.beginPath(); x.moveTo(13, 26); x.lineTo(16, -14); x.stroke();
      x.save(); x.shadowColor = "#ffd27a"; x.shadowBlur = 8; x.fillStyle = "#ffd27a"; kreis(x, 16.5, -15, 2.2); x.restore();
      // Haar & Kopf
      x.fillStyle = "#e8e2d6";
      x.beginPath(); x.moveTo(-8, -16); x.quadraticCurveTo(-12, -4, -9, 2); x.lineTo(9, 2); x.quadraticCurveTo(12, -4, 8, -16); x.closePath(); x.fill();
      x.fillStyle = "#c9a88a"; oval(x, 0, -14, 5.5, 6.5);
      x.fillStyle = "#e8e2d6"; x.beginPath(); x.moveTo(-4, -11); x.quadraticCurveTo(0, 0, 4, -11); x.quadraticCurveTo(0, -8, -4, -11); x.fill();
      x.fillStyle = "#e8e2d6"; oval(x, 0, -19, 6, 3);
      // Ohren (spitz, rötlich)
      x.fillStyle = "#c4705a"; x.beginPath(); x.moveTo(-5, -15); x.lineTo(-10, -18); x.lineTo(-5, -12); x.fill(); x.beginPath(); x.moveTo(5, -15); x.lineTo(10, -18); x.lineTo(5, -12); x.fill();
      // Augen & grimmige Brauen
      x.fillStyle = wut > 0.4 ? "#ff5a4a" : "#2a1c12"; kreis(x, -2, -14.5, 0.9); kreis(x, 2, -14.5, 0.9);
      x.strokeStyle = "#8a8070"; x.lineWidth = 1; x.beginPath(); x.moveTo(-4, -17); x.lineTo(-1, -16); x.moveTo(4, -17); x.lineTo(1, -16); x.stroke();
      // Geweih
      x.strokeStyle = "#2a2018"; x.lineWidth = 1.8; x.lineCap = "round";
      x.beginPath();
      x.moveTo(-3, -20); x.quadraticCurveTo(-9, -26, -11, -36); x.moveTo(-7, -26); x.lineTo(-14, -28); x.moveTo(-9, -31); x.lineTo(-5, -36); x.moveTo(-11, -36); x.lineTo(-15, -40);
      x.moveTo(3, -20); x.quadraticCurveTo(9, -26, 11, -36); x.moveTo(7, -26); x.lineTo(14, -28); x.moveTo(9, -31); x.lineTo(5, -36); x.moveTo(11, -36); x.lineTo(15, -40);
      x.stroke();
    }
    x.restore();
  }

  /* --- Dinge im Raubzug --- */
  const EDEL_FARBEN = ["#c4564a", "#4aa0b0", "#6fbf5a", "#8a6ad0", "#e0a046"];
  function malDing(x, d, zeit) {
    x.save(); x.translate(d.x, d.y);
    if (d.alpha != null) x.globalAlpha = klemm(d.alpha, 0, 1);
    const r = d.r;
    if (d.block === "fels") {
      x.fillStyle = "rgba(0,0,0,.3)"; oval(x, 2, r * 0.7, r + 8, 5);
    }
    switch (d.typ) {
      case "muenze": {
        x.fillStyle = "#8a5a1a"; oval(x, 0, 3, r, r * 0.45);
        for (let i = 0; i < 3; i++) { const g = x.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, "#c98a3a"); g.addColorStop(0.5, "#ffd34d"); g.addColorStop(1, "#b5782a"); x.fillStyle = g; oval(x, (i - 1) * 3, 2 - i * 3, r * 0.85, r * 0.38); }
        break;
      }
      case "beutel": {
        x.fillStyle = "#6b4a30"; x.beginPath(); x.moveTo(-r * 0.4, -r * 0.6); x.quadraticCurveTo(-r * 1.2, r * 0.2, -r * 0.6, r); x.lineTo(r * 0.6, r); x.quadraticCurveTo(r * 1.2, r * 0.2, r * 0.4, -r * 0.6); x.closePath(); x.fill();
        x.fillStyle = "#4a3424"; x.fillRect(-r * 0.45, -r * 0.7, r * 0.9, r * 0.25);
        x.fillStyle = "#ffd34d"; kreis(x, -r * 0.2, -r * 0.85, r * 0.22); kreis(x, r * 0.2, -r * 0.9, r * 0.2);
        x.fillStyle = "#e0a046"; x.font = "bold " + Math.round(r) + "px " + FONT_D; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("₲", 0, r * 0.3);
        break;
      }
      case "nugget": {
        const g = x.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r * 1.1); g.addColorStop(0, "#fff0a0"); g.addColorStop(0.4, "#ffd34d"); g.addColorStop(1, "#a8701e");
        x.fillStyle = g; x.beginPath();
        const rr = lcg(Math.floor(d.seed * 1e6) + 3);
        for (let i = 0; i < 9; i++) { const w = i / 9 * Math.PI * 2, rad = r * (0.78 + rr() * 0.32); i ? x.lineTo(Math.cos(w) * rad, Math.sin(w) * rad * 0.85) : x.moveTo(Math.cos(w) * rad, Math.sin(w) * rad * 0.85); }
        x.closePath(); x.fill();
        x.fillStyle = "rgba(255,255,255,.55)"; oval(x, -r * 0.35, -r * 0.35, r * 0.18, r * 0.1, -0.6);
        break;
      }
      case "edelstein": {
        const f = EDEL_FARBEN[Math.floor(d.seed * EDEL_FARBEN.length)];
        x.save(); x.shadowColor = f; x.shadowBlur = 10 + Math.sin(zeit * 4 + d.seed * 9) * 4;
        x.fillStyle = f; x.beginPath(); x.moveTo(0, -r * 1.1); x.lineTo(r, -r * 0.2); x.lineTo(0, r * 1.1); x.lineTo(-r, -r * 0.2); x.closePath(); x.fill(); x.restore();
        x.fillStyle = "rgba(255,255,255,.45)"; x.beginPath(); x.moveTo(0, -r * 1.1); x.lineTo(r * 0.4, -r * 0.2); x.lineTo(-r * 0.4, -r * 0.2); x.closePath(); x.fill();
        break;
      }
      case "stein": {
        const g = x.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r * 1.2); g.addColorStop(0, "#8a8476"); g.addColorStop(1, "#3e3a34");
        x.fillStyle = g; x.beginPath();
        const rr = lcg(Math.floor(d.seed * 1e6) + 7);
        for (let i = 0; i < 8; i++) { const w = i / 8 * Math.PI * 2 + d.dreh, rad = r * (0.8 + rr() * 0.25); i ? x.lineTo(Math.cos(w) * rad, Math.sin(w) * rad * 0.8) : x.moveTo(Math.cos(w) * rad, Math.sin(w) * rad * 0.8); }
        x.closePath(); x.fill();
        x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1; x.beginPath(); x.moveTo(-r * 0.3, -r * 0.1); x.lineTo(r * 0.1, r * 0.3); x.stroke();
        break;
      }
      case "truhe": {
        x.rotate(d.dreh * 0.3);
        x.fillStyle = "#5a3a22"; x.fillRect(-r, -r * 0.3, r * 2, r * 1.1);
        x.fillStyle = "#6b4a30"; x.beginPath(); x.moveTo(-r, -r * 0.3); x.quadraticCurveTo(0, -r * 1.2, r, -r * 0.3); x.closePath(); x.fill();
        x.fillStyle = "#c9a35a"; x.fillRect(-r, -r * 0.35, r * 2, 2.5); x.fillRect(-r * 0.6, -r * 0.8, 2.5, r * 1.6); x.fillRect(r * 0.6 - 2.5, -r * 0.8, 2.5, r * 1.6);
        x.fillStyle = "#e0c070"; x.fillRect(-2.5, -r * 0.2, 5, 6);
        if (up("rabenauge")) {
          const sym = { gold: "💰", saat: "🌱", mimik: "👅", wild: "🦌" }[d.inhalt];
          x.font = Math.round(r) + "px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.globalAlpha = 0.9; x.fillText(sym, 0, -r * 1.35);
        }
        break;
      }
      case "res": malRessource(x, gebietVon(S.lv), r, d.seed); break;
      case "relikt": malRelikt(x, GEB[gebietVon(S.lv)].relikt, r, zeit, d.seed); break;
      case "tier": malTier(x, d.art, d.v < 0, zeit); break;
      case "stoerer": malStoerer(x, d, zeit); break;
    }
    if (d.block === "fels") {
      const g = x.createRadialGradient(-6, -8, 3, 0, 0, r + 10); g.addColorStop(0, "#7d776a"); g.addColorStop(1, "#3a3630");
      x.fillStyle = g; x.globalAlpha = 0.93;
      x.beginPath(); const rr = lcg(Math.floor(d.seed * 1e6) + 17);
      for (let i = 0; i < 10; i++) { const w = i / 10 * Math.PI * 2, rad = (r + 7) * (0.85 + rr() * 0.3); i ? x.lineTo(Math.cos(w) * rad, Math.sin(w) * rad * 0.9) : x.moveTo(Math.cos(w) * rad, Math.sin(w) * rad * 0.9); }
      x.closePath(); x.fill(); x.globalAlpha = 1;
      x.strokeStyle = "rgba(0,0,0,.4)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-r * 0.5, -r * 0.5); x.lineTo(0, 0); x.lineTo(r * 0.4, -r * 0.2); x.moveTo(0, 0); x.lineTo(-r * 0.1, r * 0.6); x.stroke();
      // ein Glitzern verrät den Schatz darunter
      x.fillStyle = "rgba(255,211,77," + (0.5 + Math.sin(zeit * 3 + d.seed * 10) * 0.4) + ")"; kreis(x, r * 0.3, r * 0.1, 1.8);
      x.font = "11px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.globalAlpha = 0.85; x.fillText("🐻", r * 0.75, -r * 0.8);
    } else if (d.block === "netz") {
      x.strokeStyle = "rgba(235,226,204,.75)"; x.lineWidth = 0.9;
      for (let a = 0; a < 8; a++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a * 0.785) * (r + 8), Math.sin(a * 0.785) * (r + 8)); x.stroke(); }
      for (let rr = 5; rr < r + 8; rr += 4.5) { x.beginPath(); for (let a = 0; a <= 8; a++) { const px = Math.cos(a * 0.785) * rr, py = Math.sin(a * 0.785) * rr; a ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
      x.font = "11px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.globalAlpha = 0.85; x.fillText("🐀", r * 0.8, -r * 0.8);
    }
    x.restore();
  }
  function malRessource(x, g, r, seed) {
    const rs = GEB[g].stil.res;
    if (rs === "eicheln") {
      for (const [ox, oy] of [[-4, 2], [4, 0]]) { x.fillStyle = "#a8783e"; oval(x, ox, oy + 2, 4, 5.5); x.fillStyle = "#5a4430"; oval(x, ox, oy - 2.5, 4.8, 2.6); x.fillRect(ox - 0.6, oy - 6, 1.2, 2); }
    } else if (rs === "kraeuter") {
      x.strokeStyle = "#4d6b35"; x.lineWidth = 1.4; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(0, 8); x.quadraticCurveTo(i * 3, 0, i * 5, -7); x.stroke(); x.fillStyle = "#6f9a3a"; oval(x, i * 5, -7, 2.4, 3.6, i * 0.3); }
      x.fillStyle = "#8a6440"; x.fillRect(-3, 6, 6, 3);
    } else if (rs === "moos") {
      for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? "#5f8a4a" : "#4a7038"; kreis(x, Math.cos(i) * 5, Math.sin(i * 1.3) * 4, 4.5); }
    } else if (rs === "kristalle") {
      x.save(); x.shadowColor = "#7fd6e0"; x.shadowBlur = 10; x.fillStyle = "#7fd6e0";
      for (const [ox, h] of [[-4, 12], [1, 16], [5, 10]]) { x.beginPath(); x.moveTo(ox - 2.5, 6); x.lineTo(ox, 6 - h); x.lineTo(ox + 2.5, 6); x.fill(); }
      x.restore();
    } else if (rs === "wurzelholz") {
      x.strokeStyle = "#8a6440"; x.lineWidth = 3; x.lineCap = "round"; x.beginPath(); x.moveTo(-8, 4); x.quadraticCurveTo(0, -6, 8, 2); x.moveTo(-2, -1); x.lineTo(-5, -8); x.moveTo(3, 0); x.lineTo(6, -6); x.stroke();
    } else if (rs === "sporen") {
      x.save(); x.shadowColor = "#c49ae0"; x.shadowBlur = 8;
      for (const [ox, s] of [[-4, 1], [4, 0.8]]) { x.fillStyle = "#e8dcd0"; x.fillRect(ox - 1.2, -1, 2.4, 7 * s); x.fillStyle = "#c49ae0"; oval(x, ox, -1, 5 * s, 3.5 * s); }
      x.restore();
    } else if (rs === "muscheln") {
      x.fillStyle = "#e8c8b0"; x.beginPath(); x.moveTo(0, 6); x.lineTo(-8, -2); x.quadraticCurveTo(0, -12, 8, -2); x.closePath(); x.fill();
      x.strokeStyle = "rgba(138,100,64,.6)"; x.lineWidth = 0.8; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(0, 6); x.lineTo(i * 3.5, -7); x.stroke(); }
    } else if (rs === "pfeffer") { // Drachenpfeffer: rote Schoten, die von innen glühen
      x.save(); x.shadowColor = "#ff5a2a"; x.shadowBlur = 8;
      for (const [ox, w] of [[-3.5, -0.35], [3.5, 0.3]]) { x.save(); x.translate(ox, 0); x.rotate(w); x.fillStyle = "#d8301a"; x.beginPath(); x.moveTo(-2.6, -5); x.quadraticCurveTo(-3, 3, 0, 8); x.quadraticCurveTo(3, 3, 2.6, -5); x.closePath(); x.fill(); x.fillStyle = "rgba(255,200,120,.6)"; oval(x, -0.9, -1, 0.8, 3); x.fillStyle = "#4d6b35"; x.fillRect(-1.4, -7.5, 2.8, 2.6); x.restore(); }
      x.restore();
    } else { // Feuermoos
      x.save(); x.shadowColor = "#ff8a3a"; x.shadowBlur = 10;
      for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? "#ff8a3a" : "#e0602a"; kreis(x, Math.cos(i) * 5, Math.sin(i * 1.3) * 4, 4); }
      x.restore();
    }
  }
  function malRelikt(x, art, r, zeit, seed) {
    x.save(); x.shadowColor = "#ffd34d"; x.shadowBlur = 12 + Math.sin(zeit * 3 + seed * 5) * 5;
    const g = x.createLinearGradient(-r, -r, r, r); g.addColorStop(0, "#fff0a0"); g.addColorStop(0.5, "#ffd34d"); g.addColorStop(1, "#a8701e");
    x.fillStyle = g; x.strokeStyle = g;
    if (art === "krone") {
      x.beginPath(); x.moveTo(-r, r * 0.5); x.lineTo(-r, -r * 0.3); x.lineTo(-r * 0.5, r * 0.1); x.lineTo(0, -r * 0.7); x.lineTo(r * 0.5, r * 0.1); x.lineTo(r, -r * 0.3); x.lineTo(r, r * 0.5); x.closePath(); x.fill();
      x.fillStyle = "#c4564a"; kreis(x, 0, r * 0.2, 2.5); x.fillStyle = "#4aa0b0"; kreis(x, -r * 0.6, r * 0.25, 2); kreis(x, r * 0.6, r * 0.25, 2);
    } else if (art === "kelch") {
      x.beginPath(); x.moveTo(-r * 0.8, -r * 0.8); x.quadraticCurveTo(-r * 0.8, r * 0.1, 0, r * 0.2); x.quadraticCurveTo(r * 0.8, r * 0.1, r * 0.8, -r * 0.8); x.closePath();
      x.fillStyle = "#d8d4cc"; x.fill(); x.fillRect(-1.5, r * 0.1, 3, r * 0.6); oval(x, 0, r * 0.75, r * 0.5, 2.5);
    } else if (art === "amulett") {
      x.lineWidth = 1.5; x.beginPath(); x.arc(0, -r * 0.6, r * 0.7, Math.PI * 0.15, Math.PI * 0.85, true); x.stroke();
      kreis(x, 0, r * 0.2, r * 0.55); x.fillStyle = "#8a6ad0"; kreis(x, 0, r * 0.2, r * 0.3);
    } else if (art === "hammer") {
      x.fillStyle = "#6b4a30"; x.fillRect(-1.8, -r * 0.3, 3.6, r * 1.2);
      x.fillStyle = g; x.fillRect(-r * 0.75, -r * 0.8, r * 1.5, r * 0.6);
      x.fillStyle = "#7fd6e0"; x.fillRect(-r * 0.35, -r * 0.6, 2, 2); x.fillRect(r * 0.15, -r * 0.6, 2, 2);
    } else if (art === "schuppe") {
      x.fillStyle = "#6fbf5a"; x.beginPath(); x.moveTo(0, -r); x.quadraticCurveTo(r, -r * 0.2, 0, r); x.quadraticCurveTo(-r, -r * 0.2, 0, -r); x.fill();
      x.strokeStyle = "#ffd34d"; x.lineWidth = 1.5; x.stroke();
    } else if (art === "idol") {
      oval(x, 0, 0, r * 0.45, r * 0.55); kreis(x, 0, -r * 0.6, r * 0.32);
      x.lineWidth = 1.6; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(-3, -r * 0.1 + i * 3.5); x.lineTo(-r, -r * 0.4 + i * 6); x.moveTo(3, -r * 0.1 + i * 3.5); x.lineTo(r, -r * 0.4 + i * 6); x.stroke(); }
      x.fillStyle = "#c4564a"; kreis(x, -1.5, -r * 0.65, 1); kreis(x, 1.5, -r * 0.65, 1);
    } else if (art === "perle") {
      x.fillStyle = "#e8c8b0"; x.beginPath(); x.moveTo(-r, r * 0.3); x.quadraticCurveTo(0, -r * 1.3, r, r * 0.3); x.closePath(); x.fill();
      const pg = x.createRadialGradient(-3, -3, 1, 0, 0, r * 0.6); pg.addColorStop(0, "#ffffff"); pg.addColorStop(1, "#c8c0d8");
      x.fillStyle = pg; kreis(x, 0, 0, r * 0.55);
    } else if (art === "drachenmuenze") { // faustgroße Goldmünze mit Drachenkopf – das Abzeichen der Grauen Geister
      kreis(x, 0, 0, r * 0.95);
      x.shadowBlur = 0; x.strokeStyle = "#a8701e"; x.lineWidth = 1.4; x.beginPath(); x.arc(0, 0, r * 0.78, 0, Math.PI * 2); x.stroke();
      x.fillStyle = "#a8701e"; x.beginPath(); x.moveTo(-r * 0.45, r * 0.15); x.quadraticCurveTo(-r * 0.2, -r * 0.45, r * 0.25, -r * 0.35); x.lineTo(r * 0.5, -r * 0.6); x.lineTo(r * 0.38, -r * 0.2); x.lineTo(r * 0.55, r * 0.05); x.quadraticCurveTo(r * 0.1, r * 0.05, -r * 0.05, r * 0.45); x.closePath(); x.fill();
      x.fillStyle = "#c4564a"; kreis(x, r * 0.15, -r * 0.2, 1.3);
    }
    x.restore();
  }
  function malTier(x, art, links, zeit) {
    x.save(); if (!links) x.scale(-1, 1);
    if (art === "hase") {
      x.fillStyle = "#9a7650"; oval(x, 2, 2, 10, 6.5); kreis(x, -8, -2, 5);
      x.fillStyle = "#8a6a4a"; oval(x, -7, -11, 1.8, 6, -0.3); oval(x, -4, -11, 1.8, 6, 0.2);
      x.fillStyle = "#f1e7cf"; kreis(x, 12, 0, 2.5);
      x.fillStyle = "#1a1210"; kreis(x, -10, -3, 1);
    } else if (art === "fledermaus") {
      const f = Math.sin(zeit * 16) * 5;
      x.fillStyle = "#2a2632"; x.beginPath(); x.moveTo(0, 0); x.lineTo(-14, -4 - f); x.lineTo(-10, 2); x.lineTo(-6, 0); x.lineTo(0, 4); x.lineTo(6, 0); x.lineTo(10, 2); x.lineTo(14, -4 - f); x.closePath(); x.fill();
      oval(x, 0, 1, 3.5, 4.5); x.fillStyle = "#e0a046"; kreis(x, -1.3, 0, 0.8); kreis(x, 1.3, 0, 0.8);
    } else if (art === "salamander") {
      const w = Math.sin(zeit * 10) * 2;
      x.save(); x.shadowColor = "#ff6a2a"; x.shadowBlur = 6;
      x.strokeStyle = "#e0602a"; x.lineWidth = 3; x.lineCap = "round"; x.beginPath(); x.moveTo(4, 0); x.quadraticCurveTo(10, w, 15, -w); x.stroke();
      x.fillStyle = "#e0602a"; oval(x, -1, 0, 7, 3.6); oval(x, -8, -0.5, 3.6, 3);
      x.fillStyle = "#c4361a"; for (const [lx, ly] of [[-4, -4], [-4, 4], [3, -4], [3, 4]]) oval(x, lx + (ly > 0 ? w : -w) * 0.3, ly, 1.6, 1.2);
      x.restore();
      x.fillStyle = "#ffd34d"; kreis(x, -3, -1, 1); kreis(x, 1, 0.5, 1);
      x.fillStyle = "#1a1210"; kreis(x, -9.5, -1.5, 0.9);
    } else { // Fisch
      x.fillStyle = "#4aa0b0"; oval(x, 0, 0, 10, 5);
      x.beginPath(); x.moveTo(8, 0); x.lineTo(15, -5 + Math.sin(zeit * 10) * 2); x.lineTo(15, 5 + Math.sin(zeit * 10) * 2); x.fill();
      x.fillStyle = "#ebe2cc"; kreis(x, -5, -1, 1.5); x.fillStyle = "#1a1210"; kreis(x, -5.3, -1, 0.7);
    }
    x.restore();
  }
  function malStoerer(x, d, zeit) {
    if (d.art === "spinne") {
      x.save(); x.strokeStyle = "rgba(235,226,204,.35)"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, -12); x.lineTo(0, 106 - d.y); x.stroke(); x.restore();
      x.strokeStyle = "#1a1416"; x.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { const w = Math.sin(zeit * 8 + i) * 2; x.beginPath(); x.moveTo(-3, -2 + i * 2); x.lineTo(-10, -6 + i * 4 + w); x.lineTo(-13, i * 4 + w); x.moveTo(3, -2 + i * 2); x.lineTo(10, -6 + i * 4 - w); x.lineTo(13, i * 4 - w); x.stroke(); }
      x.fillStyle = "#2a2226"; oval(x, 0, 3, 6, 7); kreis(x, 0, -5, 4);
      x.fillStyle = "#c4564a"; kreis(x, -1.5, -6, 0.9); kreis(x, 1.5, -6, 0.9);
    } else if (d.art === "aal") {
      x.save(); if (d.v > 0) x.scale(-1, 1);
      x.strokeStyle = "#3a5a3a"; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); x.moveTo(-12, 0);
      for (let i = 0; i < 5; i++) x.lineTo(-12 + i * 6, Math.sin(zeit * 8 + i) * 3); x.stroke();
      x.fillStyle = "#f3e27a"; kreis(x, -12, -1, 1.2);
      x.restore();
    } else if (d.art === "rauch") { // Rauchschwade mit Glutfunken
      for (let i = 0; i < 4; i++) { const w = zeit * 1.5 + i * 1.7; x.fillStyle = "rgba(" + (40 + i * 8) + "," + (34 + i * 6) + "," + (32 + i * 6) + ",.72)"; kreis(x, Math.cos(w) * 4 + (i - 1.5) * 4, Math.sin(w * 1.3) * 3 - i, 7 - i * 0.6); }
      x.fillStyle = "rgba(255," + Math.round(120 + Math.sin(zeit * 9) * 60) + ",40,.9)"; kreis(x, -3, -1, 1.3); kreis(x, 3.5, 1, 1.1); kreis(x, Math.sin(zeit * 4) * 4, -7 - (zeit * 8 % 6), 0.9);
    } else { // Wespe
      const f = Math.sin(zeit * 40) * 3;
      x.fillStyle = "rgba(235,226,204,.5)"; oval(x, -2, -6 - f * 0.3, 4, 6, -0.5); oval(x, 3, -6 + f * 0.3, 4, 6, 0.5);
      x.fillStyle = "#e0b030"; oval(x, 0, 0, 8, 5);
      x.fillStyle = "#1a1210"; x.fillRect(-3, -5, 2, 10); x.fillRect(2, -5, 2, 10);
      x.beginPath(); x.moveTo(8 * Math.sign(d.v || 1), 0); x.lineTo(12 * Math.sign(d.v || 1), 1); x.lineTo(8 * Math.sign(d.v || 1), 2); x.fill();
    }
  }

  /* --- Ranke/Haken je nach Gestalt --- */
  function malRanke(x, R, zeit) {
    const h = R.haken, sp = hakenSpitze(h), form = R.form;
    const dx = sp.x - DREH.x, dy = sp.y - DREH.y, l = Math.hypot(dx, dy) || 1;
    if (form === "rabe") {
      x.strokeStyle = "rgba(20,18,26,.5)"; x.setLineDash([3, 5]); x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(DREH.x, DREH.y); x.lineTo(sp.x, sp.y); x.stroke(); x.setLineDash([]);
      malEcho(x, sp.x, sp.y - 4, 0.55, "rabe", 0, zeit);
      return;
    }
    const breit = form === "baer" ? 5 : form === "ratte" ? 2 : 3.2;
    const farbe = form === "baer" ? "#6b4a30" : form === "ratte" ? "#b08c7a" : "#4d6b35";
    x.strokeStyle = farbe; x.lineWidth = breit; x.lineCap = "round";
    x.beginPath(); x.moveTo(DREH.x, DREH.y);
    const n = Math.max(2, Math.floor(l / 14));
    for (let i = 1; i <= n; i++) { const u = i / n, wel = Math.sin(u * 9 + zeit * 6) * (form === "ratte" ? 2 : 3) * (1 - u); x.lineTo(DREH.x + dx * u - dy / l * wel, DREH.y + dy * u + dx / l * wel); }
    x.stroke();
    if (form === "ranke") { // Blätter
      x.fillStyle = "#6f9a3a";
      for (let i = 1; i < n; i += 2) { const u = i / n; x.save(); x.translate(DREH.x + dx * u, DREH.y + dy * u); x.rotate(Math.atan2(dy, dx) + (i % 4 === 1 ? 0.9 : -0.9)); oval(x, 4, 0, 4, 1.8); x.restore(); }
    }
    x.save(); x.translate(sp.x, sp.y); x.rotate(Math.atan2(dy, dx) - Math.PI / 2);
    if (form === "baer") { x.fillStyle = "#4a3424"; oval(x, 0, 3, 7, 6); x.fillStyle = "#e8e2d6"; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(i * 3.5 - 1, 7); x.lineTo(i * 3.5, 12); x.lineTo(i * 3.5 + 1, 7); x.fill(); } }
    else if (form === "ratte") { x.restore(); malEcho(x, sp.x, sp.y, 0.55, "ratte", 0, zeit); return; }
    else { x.strokeStyle = "#3b4a2a"; x.lineWidth = 2.2; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-7, 5, -4, 10); x.moveTo(0, 0); x.lineTo(0, 11); x.moveTo(0, 0); x.quadraticCurveTo(7, 5, 4, 10); x.stroke(); }
    x.restore();
  }

  /* --- Gegner der Abwehr (von oben, klein) --- */
  const MEDAILLONS = {};
  function medaillonLaden() {
    Object.keys(FEINDE).forEach(k => {
      const d = FEINDE[k]; if (!d.bild || MEDAILLONS[k]) return;
      const img = new Image(); img.decoding = "async";
      img.onload = () => {
        const n = 128, c = document.createElement("canvas"); c.width = n; c.height = n;
        const x = c.getContext("2d"), w = img.naturalWidth, h = img.naturalHeight, s = Math.min(w, h) * 0.78;
        x.beginPath(); x.arc(n / 2, n / 2, n / 2, 0, Math.PI * 2); x.clip();
        x.drawImage(img, (w - s) / 2, klemm(h * d.bildY - s / 2, 0, h - s), s, s, 0, 0, n, n);
        MEDAILLONS[k] = c;
      };
      img.src = d.bild;
    });
  }
  function malFeind(x, e, zeit) {
    const d = e.d, r = e.r;
    x.save(); x.translate(e.x, e.y);
    if (e.unsT) x.globalAlpha = 0.28;
    const hop = e.flug ? Math.sin(zeit * 10 + e.ph) * 2 : Math.abs(Math.sin(zeit * 9 + e.ph)) * -1.6;
    x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 1, r * 0.7 + (e.flug ? 8 : 0), r * 0.9, r * 0.4);
    x.translate(0, hop - (e.flug ? 6 : 0));
    if (e.treffT > 0) { x.save(); x.globalAlpha = 0.8; x.fillStyle = "#ebe2cc"; kreis(x, 0, 0, r + 2); x.restore(); }
    if (e.verwandelt) { malTier(x, "fledermaus", true, zeit); x.restore(); lebensbalken(x, e); return; }
    if (e.lx != null) { const mx = e.x - e.lx, my = e.y - e.ly; if (mx * mx + my * my > 0.02) { const ziel = Math.atan2(my, mx); e.hw = e.hw == null ? ziel : e.hw + Math.atan2(Math.sin(ziel - e.hw), Math.cos(ziel - e.hw)) * 0.25; } }
    e.lx = e.x; e.ly = e.y;
    if (!MEDAILLONS[e.typ]) {
      x.save(); if (e.hw != null) x.rotate(e.hw + Math.PI / 2);
      const krabbler = e.typ === "spinne" || e.typ === "ettercap" || e.typ === "blight" || e.typ === "glutkaefer" || e.flug;
      if (!krabbler) { const sw = Math.sin(zeit * 13 + e.ph) * r * 0.38 * (e.festT > 0 || e.halt ? 0 : 1); x.fillStyle = "rgba(18,12,8,.85)"; oval(x, -r * 0.45, sw, r * 0.24, r * 0.32); oval(x, r * 0.45, -sw, r * 0.24, r * 0.32); }
      x.scale(1.12, 1.12);
      x.fillStyle = "rgba(8,6,4,.55)"; kreis(x, 0, 0.6, r + 1.4);
      malFigur(x, e.typ, r, d, zeit, e);
      x.restore();
      x.strokeStyle = "rgba(255,236,200,.3)"; x.lineWidth = 1.1; x.beginPath(); x.arc(0, 0, r * 0.92, -2.7, -1.0); x.stroke();
    } else {
      x.save(); x.shadowColor = d.unbesiegbar ? "#c4564a" : "#e0a046"; x.shadowBlur = 14;
      x.fillStyle = d.farbe; kreis(x, 0, 0, r + 3); x.restore();
      x.drawImage(MEDAILLONS[e.typ], -r, -r, r * 2, r * 2);
      x.strokeStyle = d.unbesiegbar ? "#c4564a" : "#e0a046"; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, r + 1, 0, Math.PI * 2); x.stroke();
    }
    if (e.bremsT > 0 && e.bremse < 1) {
      x.strokeStyle = "rgba(159,214,236,.38)"; x.lineWidth = 1; x.setLineDash([2, 3]); x.beginPath(); x.arc(0, 0, r + 2.5, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
      x.fillStyle = "rgba(220,244,252,.85)"; for (let i = 0; i < 3; i++) { const w = zeit * 1.5 + i * 2.1 + e.ph; kreis(x, Math.cos(w) * (r + 2.5), Math.sin(w) * (r + 2.5), 1.2); }
    }
    if (e.giftT > 0) { x.fillStyle = "rgba(196,154,224,.5)"; kreis(x, Math.sin(zeit * 5) * r * 0.7, -r - 3, 2); kreis(x, -Math.cos(zeit * 4) * r * 0.6, -r - 5, 1.5); }
    if (e.beute) {
      x.save(); x.translate(0, -r - 9 + Math.sin(zeit * 12) * 1.2);
      x.fillStyle = "#6b4a30"; x.beginPath(); x.moveTo(-3, -5); x.quadraticCurveTo(-9, 1, -5, 6); x.lineTo(5, 6); x.quadraticCurveTo(9, 1, 3, -5); x.closePath(); x.fill();
      x.fillStyle = "#ffd34d"; kreis(x, -1.5, -5.5, 2); kreis(x, 1.8, -6, 1.8);
      x.fillStyle = "#e0a046"; x.font = "bold 7px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("₲", 0, 1.5);
      x.restore();
      x.strokeStyle = "rgba(255,211,77," + (0.5 + Math.sin(zeit * 10) * 0.3) + ")"; x.lineWidth = 1.5; x.setLineDash([3, 3]); x.beginPath(); x.arc(0, 0, r + 4, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    }
    if (e.festT > 0) { x.strokeStyle = "#8a6440"; x.lineWidth = 2; x.beginPath(); x.moveTo(-r, r); x.quadraticCurveTo(-r * 0.5, 0, 0, r * 0.8); x.quadraticCurveTo(r * 0.5, 0, r, r); x.stroke(); }
    if (e.elite) {
      const E = ELITE[e.elite];
      x.save(); x.globalAlpha = 0.55 + Math.sin(zeit * 6 + e.ph) * 0.25; x.strokeStyle = E.farbe; x.lineWidth = 2;
      x.beginPath(); x.arc(0, 0, r + 4, 0, Math.PI * 2); x.stroke();
      if (e.schild > 0) { x.globalAlpha = 0.35; x.fillStyle = E.farbe; kreis(x, 0, 0, r + 3); }
      x.globalAlpha = 1; x.font = "10px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(E.sym, r + 3, -r - 2);
      x.restore();
    }
    x.restore();
    lebensbalken(x, e);
  }
  function lebensbalken(x, e) {
    if (e.d.unbesiegbar || (e.hp >= e.max && !(e.schild > 0))) return;
    const b = Math.max(14, e.r * 2), y = e.y - e.r - (e.flug ? 14 : 8);
    x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(e.x - b / 2 - 1, y - 1, b + 2, 4);
    x.fillStyle = e.d.boss ? "#c4564a" : e.elite ? ELITE[e.elite].farbe : "#8ac24a"; x.fillRect(e.x - b / 2, y, b * klemm(e.hp / e.max, 0, 1), 2);
    if (e.schild > 0) { x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(e.x - b / 2 - 1, y - 4, b + 2, 3); x.fillStyle = "#e0a046"; x.fillRect(e.x - b / 2, y - 3.5, b * klemm(e.schild / e.schildMax, 0, 1), 2); }
  }
  function malFigur(x, typ, r, d, zeit, e) {
    const k = { goblin: 0, rotrobe: 1, bandit: 1, bugbear: 2, soeldner: 3, zombie: 4, blight: 5, spinne: 6, drow: 7, ettercap: 8, chasme: 9, kuotoa: 10, duergar: 11, graugeist: 12, glutkaefer: 13, flammenwahrer: 14, anfuehrer: 0, glasstab: 1, nezna: 7, drokey: 12 }[typ];
    const f = d.farbe;
    if (k === 6 || k === 8) { // Spinne / Ettercap
      x.strokeStyle = "#1a1416"; x.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) { const w = Math.sin(zeit * 12 + i) * 2.5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 3, -3 + i * 2.5); x.lineTo(s * (r + 2), -r * 0.5 + i * 4 + w * s); x.stroke(); } }
      x.fillStyle = f; oval(x, 0, 2, r * 0.6, r * 0.75); x.fillStyle = k === 8 ? "#7a7270" : "#3a3236"; kreis(x, 0, -r * 0.5, r * 0.45);
      x.fillStyle = "#c4564a"; kreis(x, -1.5, -r * 0.6, 1); kreis(x, 1.5, -r * 0.6, 1);
      return;
    }
    if (k === 9) { // Chasme: Fliegendämon
      const fl = Math.sin(zeit * 30) * 3;
      x.fillStyle = "rgba(200,210,230,.45)"; oval(x, -r * 0.8, -2 - fl * 0.3, r * 0.7, r * 0.35, -0.4); oval(x, r * 0.8, -2 + fl * 0.3, r * 0.7, r * 0.35, 0.4);
      x.fillStyle = f; oval(x, 0, 2, r * 0.5, r * 0.85); x.fillStyle = "#c4564a"; kreis(x, -2.5, -r * 0.5, 2.2); kreis(x, 2.5, -r * 0.5, 2.2);
      x.strokeStyle = "#1a1416"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, -r * 0.3); x.lineTo(0, r * 0.2); x.stroke();
      return;
    }
    if (k === 13) { // Glutkäfer: Panzer mit glühenden Drüsen
      x.strokeStyle = "#2a120a"; x.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const w = Math.sin(zeit * 14 + i * 2) * 2; for (const s2 of [-1, 1]) { x.beginPath(); x.moveTo(s2 * r * 0.4, -r * 0.3 + i * r * 0.4); x.lineTo(s2 * (r + 2), -r * 0.5 + i * r * 0.5 + w * s2); x.stroke(); } }
      x.fillStyle = f; oval(x, 0, r * 0.15, r * 0.7, r * 0.85);
      x.strokeStyle = "rgba(0,0,0,.45)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, -r * 0.3); x.lineTo(0, r); x.stroke();
      x.fillStyle = "#3a1a10"; oval(x, 0, -r * 0.75, r * 0.45, r * 0.3);
      x.save(); x.shadowColor = "#ff8a3a"; x.shadowBlur = 8; x.fillStyle = "rgba(255," + Math.round(150 + Math.sin(zeit * 6) * 60) + ",60,.95)";
      kreis(x, -r * 0.3, -r * 0.75, 1.6); kreis(x, r * 0.3, -r * 0.75, 1.6); kreis(x, 0, r * 0.55, 1.8); x.restore();
      return;
    }
    if (k === 5) { // Blight: Wurzelknäuel
      x.strokeStyle = f; x.lineWidth = 2.2; x.lineCap = "round";
      for (let i = 0; i < 6; i++) { const w = i / 6 * Math.PI * 2 + Math.sin(zeit * 6) * 0.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(w) * r * 1.2, Math.sin(w) * r * 1.2); x.stroke(); }
      x.fillStyle = "#3b2a1b"; kreis(x, 0, 0, r * 0.6); x.fillStyle = "#ff3a2a"; kreis(x, -1.8, -1, 1.2); kreis(x, 1.8, -1, 1.2);
      return;
    }
    // humanoide Gestalten von oben: Schultern, Kopf, Merkmal
    x.fillStyle = "rgba(0,0,0,.25)"; kreis(x, 0, 1, r);
    x.fillStyle = f; oval(x, 0, 2, r, r * 0.75);
    const kopf = { 0: "#7d8f43", 1: "#2a2622", 2: "#8a6a3a", 3: "#9a9fa6", 4: "#7a8a6a", 7: "#e8e2f0", 10: "#4aa0a0", 11: "#8a8480", 12: "#3c3c46", 14: "#8a8480" }[k] || "#c9a88a";
    x.fillStyle = kopf; kreis(x, 0, -r * 0.25, r * 0.55);
    if (k === 0) { x.fillStyle = "#6b7d3e"; x.beginPath(); x.moveTo(-r * 0.45, -r * 0.4); x.lineTo(-r * 1.15, -r * 0.8); x.lineTo(-r * 0.35, -r * 0.1); x.fill(); x.beginPath(); x.moveTo(r * 0.45, -r * 0.4); x.lineTo(r * 1.15, -r * 0.8); x.lineTo(r * 0.35, -r * 0.1); x.fill(); x.fillStyle = "#ffd34d"; kreis(x, -1.8, -r * 0.35, 1); kreis(x, 1.8, -r * 0.35, 1); }
    if (k === 1) { x.fillStyle = typ === "bandit" ? "#3a2d20" : "#7a2f26"; kreis(x, 0, -r * 0.3, r * 0.58); x.fillStyle = "#c9a88a"; oval(x, 0, -r * 0.05, r * 0.3, r * 0.2); }
    if (k === 2) { x.fillStyle = "#6b4a2a"; kreis(x, -r * 0.4, -r * 0.6, 2.5); kreis(x, r * 0.4, -r * 0.6, 2.5); x.fillStyle = "#c4564a"; kreis(x, -2, -r * 0.3, 1.1); kreis(x, 2, -r * 0.3, 1.1); }
    if (k === 3) { x.strokeStyle = "#5a5e64"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, -r * 0.25, r * 0.55, Math.PI, 0); x.stroke(); x.fillStyle = "#c9c9c9"; x.fillRect(r * 0.7, -r, 2, r * 1.4); }
    if (k === 4) { x.fillStyle = "#3a4a2a"; kreis(x, -2, -r * 0.3, 1.4); kreis(x, 2, -r * 0.3, 1.4); x.strokeStyle = "#5a6a4c"; x.lineWidth = 3; x.beginPath(); x.moveTo(-r * 0.7, 0); x.lineTo(-r * 0.9, -r); x.moveTo(r * 0.7, 0); x.lineTo(r * 0.9, -r); x.stroke(); }
    if (k === 7) { x.strokeStyle = "rgba(138,106,208,.85)"; x.lineWidth = 1.2; x.beginPath(); x.ellipse(0, 2, r, r * 0.75, 0, 0.3, Math.PI - 0.3); x.stroke(); x.fillStyle = "#3b2f4a"; oval(x, 0, -r * 0.05, r * 0.32, r * 0.24); x.fillStyle = "#c4564a"; kreis(x, -1.5, -r * 0.1, 0.9); kreis(x, 1.5, -r * 0.1, 0.9); }
    if (k === 10) {
      x.fillStyle = "#2c5c5a"; x.beginPath(); x.moveTo(-r * 0.25, r * 0.55); x.lineTo(-r * 0.75, r * 1.25 + Math.sin(zeit * 9 + (e ? e.ph : 0)) * 1.5); x.lineTo(0, r * 0.95); x.lineTo(r * 0.75, r * 1.25 - Math.sin(zeit * 9 + (e ? e.ph : 0)) * 1.5); x.lineTo(r * 0.25, r * 0.55); x.fill();
      x.strokeStyle = "#7ac4c0"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(0, -r * 0.1); x.lineTo(0, r * 0.7); x.stroke();
      x.strokeStyle = "#b8a888"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(r * 0.85, r * 0.55); x.lineTo(r * 0.85, -r * 1.25); x.stroke();
      x.fillStyle = "#d8d0c0"; x.beginPath(); x.moveTo(r * 0.85, -r * 1.55); x.lineTo(r * 0.6, -r * 1.15); x.lineTo(r * 1.1, -r * 1.15); x.fill();
      x.fillStyle = "#ebe2cc"; kreis(x, -r * 0.35, -r * 0.35, 2.4); kreis(x, r * 0.35, -r * 0.35, 2.4); x.fillStyle = "#1a1210"; kreis(x, -r * 0.35, -r * 0.4, 1.1); kreis(x, r * 0.35, -r * 0.4, 1.1);
    }
    if (k === 11) { x.strokeStyle = "#3a3634"; x.lineWidth = 2; x.beginPath(); x.arc(0, -r * 0.25, r * 0.58, Math.PI * 0.95, Math.PI * 2.05); x.stroke(); x.fillStyle = "#4a4440"; x.beginPath(); x.moveTo(-r * 0.4, -r * 0.05); x.lineTo(0, r * 0.6); x.lineTo(r * 0.4, -r * 0.05); x.fill(); x.fillStyle = "#b8b0a8"; x.fillRect(-r * 0.95, -r * 0.2, 2, r * 1.1); }
    if (k === 12) { // Grauer Geist: Kapuze, Tuch vor dem Gesicht, Dolch
      x.fillStyle = "#2a2a32"; x.beginPath(); x.moveTo(-r * 0.55, -r * 0.1); x.quadraticCurveTo(0, -r * 1.25, r * 0.55, -r * 0.1); x.quadraticCurveTo(0, -r * 0.45, -r * 0.55, -r * 0.1); x.fill();
      x.fillStyle = "#c9c4bc"; kreis(x, -r * 0.2, -r * 0.3, 0.9); kreis(x, r * 0.2, -r * 0.3, 0.9);
      x.strokeStyle = "#c8c8d0"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(r * 0.8, r * 0.3); x.lineTo(r * 1.1, -r * 0.6); x.stroke();
    }
    if (k === 14) { // Bewahrer der Flamme: rote Robe, Kapuze, Flammenschale
      x.fillStyle = "#6a1a10"; kreis(x, 0, -r * 0.28, r * 0.6); x.fillStyle = "#8a8480"; oval(x, 0, -r * 0.02, r * 0.3, r * 0.22);
      x.fillStyle = "#3a3634"; x.fillRect(r * 0.6, -r * 0.2, 3, 3);
      x.save(); x.shadowColor = "#ff8a3a"; x.shadowBlur = 10; x.fillStyle = "rgba(255," + Math.round(140 + Math.sin(zeit * 11) * 50) + ",50,.95)";
      x.beginPath(); x.moveTo(r * 0.55, -r * 0.2); x.quadraticCurveTo(r * 0.75, -r * 0.9, r * 0.95 + Math.sin(zeit * 13) * 1.2, -r * 1.2); x.quadraticCurveTo(r * 1.05, -r * 0.7, r * 1.15, -r * 0.2); x.fill(); x.restore();
    }
    if (typ === "drokey") { // die Diebesmarke: faustgroße Goldmünze mit Drachenkopf
      x.save(); x.shadowColor = "#ffd34d"; x.shadowBlur = 10; x.fillStyle = "#ffd34d"; kreis(x, 0, r * 0.42, r * 0.42); x.restore();
      x.strokeStyle = "#a8701e"; x.lineWidth = 1; x.beginPath(); x.arc(0, r * 0.42, r * 0.32, 0, Math.PI * 2); x.stroke();
      x.fillStyle = "#a8701e"; x.beginPath(); x.moveTo(-r * 0.2, r * 0.55); x.quadraticCurveTo(-r * 0.1, r * 0.2, r * 0.12, r * 0.25); x.lineTo(r * 0.24, r * 0.12); x.lineTo(r * 0.2, r * 0.36); x.quadraticCurveTo(0, r * 0.4, -r * 0.05, r * 0.6); x.closePath(); x.fill();
      x.strokeStyle = "#c8c8d0"; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-r * 0.8, r * 0.3); x.lineTo(-r * 1.1, -r * 0.6); x.stroke();
    }
    if (typ === "anfuehrer") { x.fillStyle = "#ffd34d"; x.beginPath(); x.moveTo(-5, -r * 0.7); x.lineTo(-5, -r * 1.05); x.lineTo(-2, -r * 0.85); x.lineTo(0, -r * 1.15); x.lineTo(2, -r * 0.85); x.lineTo(5, -r * 1.05); x.lineTo(5, -r * 0.7); x.fill(); }
    if (typ === "glasstab") { x.save(); x.shadowColor = "#9fd6ec"; x.shadowBlur = 8; x.strokeStyle = "#cfeaf4"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(r * 0.8, r * 0.6); x.lineTo(r * 1.1, -r * 1.1); x.stroke(); x.restore(); }
    if (typ === "nezna") { x.save(); x.shadowColor = "#8a6ad0"; x.shadowBlur = 10; x.strokeStyle = "rgba(196,154,224,.7)"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, r + 3, 0, Math.PI * 2); x.stroke(); x.restore(); }
  }

  /* --- Wächter: jeder hat eine eigene Gestalt --- */
  function sockel(x, farbe) {
    x.fillStyle = "rgba(0,0,0,.42)"; oval(x, 2, 9, 19, 7);
    const g = x.createRadialGradient(-5, 2, 2, 0, 5, 19); g.addColorStop(0, "#4d3e2b"); g.addColorStop(1, "#211a12");
    x.fillStyle = g; oval(x, 0, 5, 17, 9);
    x.strokeStyle = farbe; x.globalAlpha = 0.75; x.lineWidth = 1.6; x.beginPath(); x.ellipse(0, 5, 17, 9, 0, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
  }
  function blatt(x, bx, by, w, l, b, farbe) { x.save(); x.translate(bx, by); x.rotate(w); x.fillStyle = farbe; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(l * 0.5, -b, l, 0); x.quadraticCurveTo(l * 0.5, b, 0, 0); x.fill(); x.restore(); }
  function kristall(x, bx, by, w, h, br, an) {
    x.save(); x.translate(bx, by); x.rotate(w);
    const g = x.createLinearGradient(-br, 0, br, 0); g.addColorStop(0, "#7fb8d4"); g.addColorStop(0.45, "#e6f6fc"); g.addColorStop(1, "#5d9cbc");
    x.fillStyle = g; x.beginPath(); x.moveTo(-br, 0); x.lineTo(-br, -h); x.lineTo(0, -h - br * 1.4); x.lineTo(br, -h); x.lineTo(br, 0); x.closePath(); x.fill();
    x.strokeStyle = "rgba(255,255,255," + (0.5 + an) + ")"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, -1); x.lineTo(0, -h - br * 1.3); x.stroke();
    x.restore();
  }
  /* T kann null sein (Vorschau in der Bauleiste) */
  function malTurm(x, k, st, T, zeit) {
    const w = WACHTER[k], an = T ? (T.anim || 0) / 0.3 : 0, sk = 1 + 0.09 * st;
    x.save(); x.scale(sk, sk);
    if (k === "dorn") {
      sockel(x, w.farbe);
      for (let i = 0; i < 5; i++) blatt(x, 0, 5, Math.PI + 0.3 + i * 0.6, 12, 4, i % 2 ? "#4d6b35" : "#5f8a3e");
      // gewundener Stiel mit Dornen
      x.strokeStyle = "#3b5a24"; x.lineWidth = 4.5; x.lineCap = "round";
      x.beginPath(); x.moveTo(0, 6); x.bezierCurveTo(-7, -1, 6, -4, 0, -11); x.stroke();
      x.fillStyle = "#cfe6a8";
      for (const [tx, ty, tw] of [[-3.5, 1, Math.PI], [3, -4, 0], [-1.5, -8, Math.PI]]) { x.beginPath(); x.moveTo(tx, ty - 1.4); x.lineTo(tx + Math.cos(tw) * 4, ty); x.lineTo(tx, ty + 1.4); x.fill(); }
      // Kopf: Dornenschote, die zum Ziel zeigt
      const wink = T ? T.winkel : -Math.PI / 2.4;
      x.save(); x.translate(0, -12); x.rotate(wink); x.translate(-an * 4, 0);
      if (st >= 2) for (let i = 0; i < 6; i++) blatt(x, -2, 0, i * 1.047 + zeit * 0.4, 9, 3.5, i % 2 ? "#c4564a" : "#9b3a2f");
      const g = x.createLinearGradient(-8, -6, 8, 6); g.addColorStop(0, "#7da84a"); g.addColorStop(1, "#2f4a1c");
      x.fillStyle = g; oval(x, 0, 0, 9 + st, 6 + st * 0.5);
      x.fillStyle = "#cfe6a8";
      for (let i = 0; i < 3 + st; i++) { const a = Math.PI * 0.6 + i * (Math.PI * 0.8 / (2 + st)); x.beginPath(); x.moveTo(Math.cos(a) * 7, Math.sin(a) * 5 - 1.5); x.lineTo(Math.cos(a) * 12, Math.sin(a) * 9); x.lineTo(Math.cos(a) * 7 + 1.5, Math.sin(a) * 5 + 1.5); x.fill(); }
      x.fillStyle = "#6b2420"; oval(x, 8 + st, 0, 2.6 + an * 1.5, 3.4 + an * 1.5);
      x.fillStyle = "#e8c070"; kreis(x, 3, -2.4, 1.1);
      x.restore();
    } else if (k === "wurzel") {
      sockel(x, w.farbe);
      // Wurzeln, die beim Schlag ausgreifen
      x.strokeStyle = "#5a3f26"; x.lineCap = "round";
      for (let i = 0; i < 5 + st; i++) {
        const a = (i / (5 + st)) * Math.PI * 2 + 0.3, l = 13 + st * 2 + an * 8 + Math.sin(zeit * 2 + i) * 0.8;
        x.lineWidth = 3.2 - i * 0.2; x.beginPath(); x.moveTo(Math.cos(a) * 5, 4 + Math.sin(a) * 3);
        x.quadraticCurveTo(Math.cos(a + 0.4) * l * 0.7, 4 + Math.sin(a + 0.4) * l * 0.45, Math.cos(a) * l, 4 + Math.sin(a) * l * 0.55); x.stroke();
      }
      // Stumpf
      let g = x.createLinearGradient(-9, 0, 9, 0); g.addColorStop(0, "#4a3220"); g.addColorStop(0.5, "#7a5638"); g.addColorStop(1, "#3b2818");
      x.fillStyle = g; x.beginPath(); x.moveTo(-10, 5); x.quadraticCurveTo(-8, -4, -8, -11); x.lineTo(8, -11); x.quadraticCurveTo(8, -4, 10, 5); x.closePath(); x.fill();
      x.strokeStyle = "rgba(30,20,12,.55)"; x.lineWidth = 1; x.beginPath(); x.moveTo(-4, 3); x.lineTo(-3, -9); x.moveTo(3, 4); x.lineTo(4, -8); x.stroke();
      x.fillStyle = an > 0 ? "#d8a868" : "#b08c64"; oval(x, 0, -11, 8, 3.6);
      x.strokeStyle = "rgba(90,63,38,.8)"; x.lineWidth = 0.8; for (let r = 2; r < 8; r += 2.2) { x.beginPath(); x.ellipse(0, -11, r, r * 0.45, 0, 0, Math.PI * 2); x.stroke(); }
      if (st >= 1) { x.strokeStyle = "#4d6b35"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(5, -12); x.lineTo(7, -19); x.stroke(); blatt(x, 7, -18, -0.6, 7, 2.6, "#6f9a3a"); blatt(x, 6.5, -16, -2.4, 6, 2.4, "#5f8a3e"); }
      if (st >= 2) { x.save(); x.shadowColor = "#e0a046"; x.shadowBlur = 6; x.fillStyle = "#e0a046"; x.fillRect(-5, -6, 1.6, 5); x.fillRect(-2, -3, 3.5, 1.4); x.fillRect(2, -7, 1.6, 6); x.restore(); }
    } else if (k === "wolf") {
      x.fillStyle = "rgba(0,0,0,.42)"; oval(x, 2, 9, 20, 7);
      // Felshügel mit Höhle
      const g = x.createLinearGradient(0, -18, 0, 8); g.addColorStop(0, "#9a948a"); g.addColorStop(1, "#4a4640");
      x.fillStyle = g; x.beginPath(); x.moveTo(-19, 8); x.lineTo(-15, -4); x.lineTo(-8, -12); x.lineTo(-1, -16 - st); x.lineTo(7, -13); x.lineTo(14, -5); x.lineTo(19, 8); x.closePath(); x.fill();
      x.strokeStyle = "rgba(30,28,24,.5)"; x.lineWidth = 1; x.beginPath(); x.moveTo(-8, -12); x.lineTo(-5, -4); x.moveTo(7, -13); x.lineTo(4, -6); x.stroke();
      if (st >= 1) { x.fillStyle = "#6a655c"; oval(x, 15, 5, 6, 4.5); x.fillStyle = "#3d6a32"; oval(x, -12, -6, 5, 2); }
      x.fillStyle = "#14110e"; x.beginPath(); x.moveTo(-8, 8); x.quadraticCurveTo(-8, -6, 0, -6); x.quadraticCurveTo(8, -6, 8, 8); x.closePath(); x.fill();
      const drin = !T || !T.draussen;
      if (drin) {
        const blink = Math.sin(zeit * 1.3 + (T ? T.winkel || 0 : 0)) > 0.96 ? 0.2 : 1;
        const ph = T ? (T.phase || (T.phase = Math.random() * 6)) : 0, guck = Math.sin(zeit * 0.55 + ph);
        if (guck > 0.55) { // ein Wolf schaut aus dem Bau
          const v = Math.min(1, (guck - 0.55) / 0.2), gy = 4 - v * 6;
          x.fillStyle = "#8a847a"; oval(x, 0, gy, 5.5, 4.6); x.fillStyle = "#a8a296"; oval(x, 0, gy + 2.6, 3, 2.2);
          x.fillStyle = "#6a655c"; x.beginPath(); x.moveTo(-5, gy - 1); x.lineTo(-3.5, gy - 7); x.lineTo(-1.5, gy - 2.5); x.fill(); x.beginPath(); x.moveTo(5, gy - 1); x.lineTo(3.5, gy - 7); x.lineTo(1.5, gy - 2.5); x.fill();
          x.fillStyle = "#1a1612"; kreis(x, 0, gy + 3.6, 1.1);
        }
        x.save(); x.shadowColor = "#ffd34d"; x.shadowBlur = 6; x.fillStyle = "#ffd34d";
        oval(x, -2.5, guck > 0.55 ? 4 - Math.min(1, (guck - 0.55) / 0.2) * 6 - 0.5 : 0, 1.4, 1.4 * blink); oval(x, 2.5, guck > 0.55 ? 4 - Math.min(1, (guck - 0.55) / 0.2) * 6 - 0.5 : 0, 1.4, 1.4 * blink);
        if (st >= 2) { oval(x, -3.5, 4.5, 1.1, 1.1 * blink); oval(x, 0.5, 4.5, 1.1, 1.1 * blink); }
        x.restore();
      }
      x.strokeStyle = "#ebe2cc"; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-14, 9); x.lineTo(-9, 7); x.stroke(); x.fillStyle = "#ebe2cc"; kreis(x, -14, 9, 1.2); kreis(x, -9, 7, 1.2);
    } else if (k === "eis") {
      x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 2, 9, 18, 6);
      x.fillStyle = "rgba(207,234,244,.35)"; oval(x, 0, 5, 17, 8);
      x.strokeStyle = "rgba(159,214,236,.8)"; x.lineWidth = 1.4; x.beginPath(); x.ellipse(0, 5, 17, 8, 0, 0, Math.PI * 2); x.stroke();
      x.save(); if (an > 0) { x.shadowColor = "#cfeaf4"; x.shadowBlur = 14 * an; }
      if (st >= 2) { kristall(x, -12, 6, -0.7, 7, 2.6, an); kristall(x, 12, 6, 0.7, 7, 2.6, an); }
      kristall(x, -7, 6, -0.38, 12 + st * 2, 3.4, an);
      kristall(x, 7, 6, 0.38, 13 + st * 2, 3.4, an);
      kristall(x, 0, 6, 0, 20 + st * 4, 4.6, an);
      x.restore();
      x.fillStyle = "rgba(255,255,255," + (0.4 + Math.sin(zeit * 4) * 0.4) + ")"; kreis(x, -1.5, -10 - st * 2, 1);
    } else if (k === "blitz") {
      sockel(x, w.farbe);
      x.fillStyle = "#3b2818"; x.beginPath(); x.moveTo(-4, 6); x.lineTo(-2.5, -8); x.lineTo(2.5, -8); x.lineTo(4, 6); x.closePath(); x.fill();
      x.strokeStyle = "#3b2818"; x.lineWidth = 2; x.beginPath(); x.moveTo(-2, 5); x.lineTo(-8, 8); x.moveTo(2, 5); x.lineTo(8, 8); x.stroke();
      const kr = 1 + st * 0.12;
      for (const [cx, cy, r, f] of [[-7, -12, 7, "#1f3320"], [7, -12, 7, "#1f3320"], [0, -16, 8.5, "#2b4a2a"], [-4, -10, 6, "#2b4a2a"], [5, -9, 5.5, "#24402a"]]) { x.fillStyle = f; kreis(x, cx * kr, cy * kr, r * kr); }
      x.fillStyle = "rgba(243,226,122,.35)"; kreis(x, -3 * kr, -18 * kr, 2);
      // Wolke darüber
      const wy = -29 - st * 2, hell = an > 0 ? "#f3e27a" : "#6a6878";
      x.fillStyle = hell; kreis(x, -5, wy, 5); kreis(x, 1, wy - 2, 6.5); kreis(x, 7, wy, 4.5); x.fillRect(-5, wy, 12, 4.5);
      if (an > 0 || Math.sin(zeit * 3.7) > 0.93) {
        x.strokeStyle = "#fff6b0"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(1, wy + 4); x.lineTo(-1.5, wy + 8); x.lineTo(1.5, wy + 9); x.lineTo(-1, wy + 13); x.stroke();
      }
      if (st >= 2) { x.strokeStyle = "rgba(224,160,70,.8)"; x.lineWidth = 1; x.beginPath(); x.ellipse(0, -2, 6, 2, 0, 0, Math.PI * 2); x.stroke(); }
    } else if (k === "pilz") {
      x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 2, 9, 18, 6);
      x.fillStyle = "rgba(196,154,224," + (0.12 + Math.sin(zeit * 2) * 0.05) + ")"; oval(x, 0, 5, 18, 9);
      const n = 4 + st, pos = [];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4; pos.push([Math.cos(a) * 12, 5 + Math.sin(a) * 6, 0.65]); }
      pos.push([0, 2, 1 + st * 0.12]);
      pos.sort((a, b) => a[1] - b[1]).forEach(([px, py, gr], i) => {
        const druck = an * (i % 2 ? 0.7 : 1);
        x.save(); x.translate(px, py); x.scale(gr, gr);
        x.fillStyle = "#e8dcd0"; x.fillRect(-1.8, -8, 3.6, 8);
        x.save(); x.scale(1 + druck * 0.25, 1 - druck * 0.3);
        const g = x.createRadialGradient(-2, -11, 1, 0, -9, 8); g.addColorStop(0, "#d8b4ee"); g.addColorStop(1, "#7a4a9a");
        x.fillStyle = g; x.beginPath(); x.ellipse(0, -9, 7, 5, 0, Math.PI, 0); x.closePath(); x.fill();
        x.fillStyle = "#f1e7cf"; kreis(x, -3, -11, 0.9); kreis(x, 2, -12, 1.1); kreis(x, 4, -9.5, 0.8);
        x.restore(); x.restore();
      });
    }
    x.restore();
  }
  /* --- Tiergefährten --- */
  function malBaerFigur(x, zeit, schlaf, hieb, links) {
    x.save(); if (!links) x.scale(-1, 1);
    const atem = Math.sin(zeit * 2) * 0.6;
    x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 0, 10, 16, 4);
    if (schlaf) {
      x.fillStyle = "#5a3e22"; oval(x, 0, 4 - atem * 0.5, 15, 8 + atem * 0.5); x.fillStyle = "#6b4a2a"; kreis(x, -11, 4, 6.5);
      x.fillStyle = "#5a3e22"; kreis(x, -14, -1, 2.4); kreis(x, -8, -1.5, 2.4); x.fillStyle = "#c9a878"; oval(x, -15.5, 6, 3, 2.2);
      x.strokeStyle = "#2a1c12"; x.lineWidth = 1; x.beginPath(); x.arc(-12, 3.5, 1.4, 0.2, Math.PI - 0.2); x.stroke();
      x.restore(); return;
    }
    x.fillStyle = "#4a3220"; x.fillRect(4, 2, 4.5, 8); x.fillRect(-7, 2, 4.5, 8);
    x.fillStyle = "#6b4a2a"; oval(x, 1, -2 - atem, 13, 9 + atem);
    x.fillStyle = "#7d5a34"; oval(x, -2, -5 - atem, 9, 6);
    x.fillStyle = "#4a3220"; x.fillRect(-1, 2, 4.5, 8); x.fillRect(9, 2, 4, 8);
    x.save(); x.translate(-10, -7 - atem); if (hieb) x.rotate(-0.3);
    x.fillStyle = "#6b4a2a"; kreis(x, 0, 0, 6.5); x.fillStyle = "#5a3e22"; kreis(x, -3, -5.5, 2.4); kreis(x, 3.5, -5.5, 2.4);
    x.fillStyle = "#c9a878"; oval(x, -5, 1.6, 3.4, 2.6); x.fillStyle = "#1a1210"; kreis(x, -7.6, 1, 1); kreis(x, -2.6, -1.5, 0.9);
    x.restore();
    if (hieb) { x.strokeStyle = "#6b4a2a"; x.lineWidth = 4; x.lineCap = "round"; x.beginPath(); x.moveTo(-6, -2); x.lineTo(-16, -12); x.stroke(); x.strokeStyle = "#ebe2cc"; x.lineWidth = 1; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(-16, -12 + i * 2); x.lineTo(-19, -14 + i * 3); x.stroke(); } }
    x.restore();
  }
  function malTierFigur(x, k, st, T, zeit) {
    const an = T ? (T.anim || 0) / 0.3 : 0, sk = 1 + 0.1 * st;
    x.save(); x.scale(sk, sk);
    if (k === "baer") {
      // Höhle am Bauplatz – der Bär selbst steht am Weg
      x.fillStyle = "rgba(0,0,0,.4)"; oval(x, 2, 9, 19, 6);
      const g = x.createLinearGradient(0, -14, 0, 8); g.addColorStop(0, "#8a847a"); g.addColorStop(1, "#4a4640");
      x.fillStyle = g; x.beginPath(); x.moveTo(-18, 8); x.lineTo(-13, -5); x.lineTo(-4, -12); x.lineTo(6, -11); x.lineTo(14, -4); x.lineTo(18, 8); x.closePath(); x.fill();
      x.fillStyle = "#14110e"; x.beginPath(); x.moveTo(-7, 8); x.quadraticCurveTo(-7, -4, 0, -4); x.quadraticCurveTo(7, -4, 7, 8); x.closePath(); x.fill();
      if (!T) malBaerFigur(x, zeit, false, false, true);
      else { x.fillStyle = "#6b4a2a"; x.font = "10px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🐾", 0, 3); }
      if (st) { x.fillStyle = "#3d6a32"; oval(x, -12, -6, 5, 2); oval(x, 10, -6, 4, 2); }
    } else if (k === "eule") {
      x.fillStyle = "rgba(0,0,0,.4)"; oval(x, 2, 9, 14, 5);
      let g = x.createLinearGradient(-7, 0, 7, 0); g.addColorStop(0, "#4a3220"); g.addColorStop(0.5, "#7a5638"); g.addColorStop(1, "#3b2818");
      x.fillStyle = g; x.fillRect(-7, -2, 14, 10); x.fillStyle = "#a8835c"; oval(x, 0, -2, 7, 2.6);
      const neig = Math.sin(zeit * 0.9) * 0.25;
      x.save(); x.translate(0, -12);
      x.fillStyle = "#8a6a3a"; oval(x, 0, 0, 8, 10);
      x.fillStyle = "#e0cca0"; oval(x, 0, 3, 5.5, 6.5);
      x.strokeStyle = "#8a6a3a"; x.lineWidth = 0.8; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-2.5, 1 + i * 2.6); x.lineTo(0, 2.4 + i * 2.6); x.lineTo(2.5, 1 + i * 2.6); x.stroke(); }
      x.rotate(neig);
      x.fillStyle = "#8a6a3a"; kreis(x, 0, -9, 7);
      x.beginPath(); x.moveTo(-6, -13); x.lineTo(-7.5, -19); x.lineTo(-3, -14); x.fill(); x.beginPath(); x.moveTo(6, -13); x.lineTo(7.5, -19); x.lineTo(3, -14); x.fill();
      x.fillStyle = "#efe2c4"; oval(x, -3, -9, 3.6, 3.4); oval(x, 3, -9, 3.6, 3.4);
      x.save(); if (an > 0 || st) { x.shadowColor = "#ffd34d"; x.shadowBlur = 6; } x.fillStyle = "#ffcf3a"; kreis(x, -3, -9, 2.2); kreis(x, 3, -9, 2.2); x.restore();
      const blink = Math.sin(zeit * 0.7) > 0.97 ? 0.2 : 1;
      x.fillStyle = "#1a1210"; oval(x, -3, -9, 1.1, 1.1 * blink); oval(x, 3, -9, 1.1, 1.1 * blink);
      x.fillStyle = "#c98a3a"; x.beginPath(); x.moveTo(-1.2, -7); x.lineTo(0, -4.5); x.lineTo(1.2, -7); x.fill();
      x.restore();
    } else if (k === "hirsch") {
      x.fillStyle = "rgba(0,0,0,.4)"; oval(x, 1, 10, 15, 4);
      const nick = T && T.anim > 0 ? 0.5 : Math.sin(zeit * 1.1) * 0.08;
      x.strokeStyle = "#5a3a20"; x.lineWidth = 2; x.lineCap = "round";
      [[-7, 0], [-4, 0], [5, 0], [8, 0]].forEach(([lx]) => { x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx + (lx < 0 ? -0.5 : 0.5), 10); x.stroke(); });
      x.fillStyle = "#a8703a"; oval(x, 1, -3, 11, 5.5);
      x.fillStyle = "#f1e7cf"; oval(x, 11, -4, 2.4, 2.8); oval(x, 1, 0, 7, 2);
      x.save(); x.translate(-8, -6); x.rotate(-0.6 + nick);
      x.fillStyle = "#a8703a"; x.fillRect(-2.5, -9, 5, 10);
      x.translate(0, -10); x.rotate(0.6);
      x.fillStyle = "#b07a40"; oval(x, -3, 0, 5, 3.4); x.fillStyle = "#2a1c12"; kreis(x, -7, 0.4, 1); kreis(x, -3, -1, 0.8);
      x.strokeStyle = "#4a3220"; x.lineWidth = 1.4;
      const g = 1 + st * 0.25;
      x.beginPath(); x.moveTo(0, -2); x.lineTo(2 * g, -10 * g); x.moveTo(1.2 * g, -6 * g); x.lineTo(5 * g, -8 * g); x.moveTo(1.8 * g, -9 * g); x.lineTo(-1 * g, -13 * g);
      x.moveTo(-1, -2); x.lineTo(-3 * g, -9 * g); x.moveTo(-2.2 * g, -6 * g); x.lineTo(-6 * g, -7 * g); x.stroke();
      if (st) { x.save(); x.shadowColor = "#ffd34d"; x.shadowBlur = 6; x.fillStyle = "#ffd34d"; kreis(x, 2 * g, -10 * g, 1); kreis(x, -1 * g, -13 * g, 1); x.restore(); }
      x.restore();
    } else if (k === "keiler") {
      x.fillStyle = "rgba(0,0,0,.4)"; oval(x, 1, 9, 15, 4);
      const schnaub = Math.sin(zeit * 3) * 0.5;
      x.fillStyle = "#2a1c12"; x.fillRect(-8, 2, 3, 6); x.fillRect(5, 2, 3, 6); x.fillRect(-4, 3, 3, 5); x.fillRect(8, 3, 3, 5);
      x.fillStyle = "#4a3424"; oval(x, 1, -1, 12, 7);
      x.fillStyle = "#3a2618"; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(-6 + i * 3.4, -6); x.lineTo(-4.5 + i * 3.4, -10 - (i % 2) * 1.5); x.lineTo(-3 + i * 3.4, -6); x.fill(); }
      x.fillStyle = "#5a4030"; oval(x, -10, 0, 6, 5);
      x.fillStyle = "#8a6440"; oval(x, -15 + schnaub * 0.3, 2, 3, 2.6);
      x.fillStyle = "#1a1210"; kreis(x, -16, 1.6, 0.6); kreis(x, -14.5, 2.4, 0.6);
      x.fillStyle = "#f1e7cf"; x.beginPath(); x.moveTo(-13, 3); x.quadraticCurveTo(-15, -1, -12.5, -2); x.lineTo(-12.2, 2.5); x.fill();
      x.fillStyle = "#c4564a"; kreis(x, -9.5, -2, 0.9);
      x.fillStyle = "#3a2618"; x.beginPath(); x.moveTo(-8, -4); x.lineTo(-6, -8); x.lineTo(-5, -4); x.fill();
      if (st) { x.strokeStyle = "#e0a046"; x.lineWidth = 1; x.beginPath(); x.moveTo(-2, -2); x.lineTo(6, -2); x.stroke(); }
    } else if (k === "falke") {
      x.fillStyle = "rgba(0,0,0,.4)"; oval(x, 1, 9, 10, 3.5);
      x.fillStyle = "#5a3a20"; x.fillRect(-1.5, -6, 3, 15); x.fillRect(-7, -7, 14, 2.5);
      if (!T || !T.unterwegs) {
        x.save(); x.translate(0, -14);
        x.fillStyle = "#5a6a7a"; oval(x, 0, 0, 5.5, 8);
        x.fillStyle = "#efe2c4"; oval(x, -1, 2, 3.5, 5.5);
        x.strokeStyle = "#8a6a4a"; x.lineWidth = 0.7; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-2.5, 0 + i * 2.4); x.lineTo(0, 1 + i * 2.4); x.stroke(); }
        x.fillStyle = "#3a4450"; kreis(x, 0, -8, 4.2); x.fillStyle = "#efe2c4"; oval(x, -1.6, -6.6, 2, 1.6);
        x.fillStyle = "#e0b030"; x.beginPath(); x.moveTo(-3.6, -8); x.lineTo(-6.4, -6.8); x.lineTo(-3.6, -6.2); x.fill();
        x.fillStyle = "#1a1210"; kreis(x, -1.8, -8.6, 0.9);
        x.fillStyle = "#e0b030"; x.fillRect(-2, 7.5, 1.2, 1.8); x.fillRect(1, 7.5, 1.2, 1.8);
        x.fillStyle = "#3a4450"; x.beginPath(); x.moveTo(1, 5); x.lineTo(3.5, 12); x.lineTo(-1, 9); x.fill();
        if (st) { x.strokeStyle = "#ffd34d"; x.lineWidth = 0.8; x.beginPath(); x.arc(0, -8, 5.5, 3.6, 5.8); x.stroke(); }
        x.restore();
      }
    } else if (k === "dachs") {
      x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 1, 8, 17, 5);
      x.fillStyle = "#4a3828"; oval(x, 0, 4, 16, 7); x.fillStyle = "#14110e"; oval(x, 0, 4, 7.5, 4);
      const guck = T && T.anim > 0 ? -5 : -1.5 + Math.sin(zeit * 1.3) * 1.2;
      x.save(); x.beginPath(); x.rect(-10, -16, 20, 20 + 2); x.clip();
      x.fillStyle = "#8a8478"; oval(x, 0, 4 + guck, 6.5, 6);
      x.fillStyle = "#f1ece0"; oval(x, 0, 1 + guck, 4.6, 5.4);
      x.fillStyle = "#1a1612"; x.fillRect(-2.8, -4 + guck, 1.8, 8); x.fillRect(1, -4 + guck, 1.8, 8);
      x.fillStyle = "#1a1210"; kreis(x, 0, 6 + guck, 1.2);
      x.fillStyle = "#e8e2d6"; kreis(x, -1.9, 0.5 + guck, 0.6); kreis(x, 1.9, 0.5 + guck, 0.6);
      x.restore();
      if (st) { x.fillStyle = "#a8783e"; for (let i = 0; i < 3; i++) kreis(x, -13 + i * 2.5, 7 - i, 1.2); }
    }
    x.restore();
  }
  function malWachter(x, p, zeit, gewaehlt) {
    const T = p.turm, st = T.st;
    x.save(); x.translate(p.x, p.y);
    if (T.tier) {
      const r = TIERE[T.k].reich ? TIERE[T.k].reich[st] : 0;
      if (r && gewaehlt) { x.strokeStyle = "rgba(224,160,70,.6)"; x.fillStyle = "rgba(224,160,70,.08)"; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill(); x.stroke(); }
      else if (r) { x.strokeStyle = "rgba(" + (T.k === "eule" ? "255,211,77" : "207,230,168") + ",.16)"; x.setLineDash([2, 6]); x.lineWidth = 1; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
      if (gewaehlt && TIERE[T.k].pfad && T.postX != null) { x.strokeStyle = "rgba(224,160,70,.6)"; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(0, 0); x.lineTo(T.postX - p.x, T.postY - p.y); x.stroke(); x.setLineDash([]); }
    } else if (gewaehlt) {
      const w = WACHTER[T.k], rf = T._reich || 1;
      x.strokeStyle = "rgba(224,160,70,.6)"; x.fillStyle = "rgba(224,160,70,.08)"; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, w.reich[st] * rf, 0, Math.PI * 2); x.fill(); x.stroke();
      if (st < 2) { x.strokeStyle = "rgba(207,230,168,.55)"; x.setLineDash([4, 4]); x.beginPath(); x.arc(0, 0, w.reich[st + 1] * rf, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
    }
    const wachs = T.wachs == null ? 1 : T.wachs, el = wachs >= 1 ? 1 : 1 - Math.pow(1 - wachs, 3) * Math.cos(wachs * 9);
    const atem = 1 + Math.sin(zeit * 1.8 + p.x * 0.07) * 0.025;
    x.save(); x.scale(el, el * atem);
    if (T.tier) malTierFigur(x, T.k, st, T, zeit); else malTurm(x, T.k, st, T, zeit);
    x.restore();
    if (T.zweig && !T.tier) {
      const zs = { dorn: { a: "🧪", b: "🌵" }, wurzel: { a: "🪢", b: "🗡️" }, wolf: { a: "🐺", b: "👑" }, eis: { a: "🧊", b: "❄️" }, blitz: { a: "⛈️", b: "💥" }, pilz: { a: "☠️", b: "🍄" } }[T.k][T.zweig];
      x.fillStyle = "rgba(9,8,15,.75)"; kreis(x, 13, -18, 7); x.strokeStyle = "#ffd34d"; x.lineWidth = 1; x.beginPath(); x.arc(13, -18, 7, 0, Math.PI * 2); x.stroke();
      x.font = "9px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(zs, 13, -17.5);
    }
    if (S.A && S.A.barradinT > 0) { x.font = "700 11px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#e0a046"; x.fillText("♪", 12, -24 + Math.sin(zeit * 6 + p.x) * 3); }
    const stufen = T.tier ? 2 : 4;
    if (!T.tier && st >= 3) { x.save(); x.globalAlpha = 0.35 + Math.sin(zeit * 2.5) * 0.15; x.strokeStyle = "#ffd34d"; x.lineWidth = 1.5; x.beginPath(); x.ellipse(0, 5, 19, 8.5, 0, 0, Math.PI * 2); x.stroke(); x.restore(); }
    for (let i = 0; i < stufen; i++) { x.fillStyle = i <= st ? "#e0a046" : "rgba(235,226,204,.18)"; kreis(x, -(stufen - 1) * 3 + i * 6, 17, 2); }
    if (T.ausT > 0) {
      x.fillStyle = "rgba(20,20,24,.5)"; kreis(x, 0, -4, 19);
      if (T.netz) { x.strokeStyle = "rgba(235,226,204,.85)"; x.lineWidth = 0.8; for (let a = 0; a < 6; a++) { x.beginPath(); x.moveTo(0, -4); x.lineTo(Math.cos(a) * 20, -4 + Math.sin(a) * 20); x.stroke(); } x.beginPath(); x.arc(0, -4, 8, 0, 7); x.stroke(); x.beginPath(); x.arc(0, -4, 15, 0, 7); x.stroke(); }
      else { x.fillStyle = "#ebe2cc"; x.font = "11px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("💤", 10, -20); }
    }
    x.restore();
  }

  /* --- Tiere im Einsatz: Bär am Weg, Ansturm des Keilers, Fallen, Falke --- */
  function malFallen(x, A, zeit) {
    A.fallen.forEach(f => {
      x.save(); x.translate(f.x, f.y);
      x.fillStyle = "rgba(20,14,8,.75)"; oval(x, 0, 2, 7, 3.4);
      x.strokeStyle = "#a8835c"; x.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(i * 2.4, 3); x.lineTo(i * 2.6, -2 - Math.abs(i) * 0.3); x.stroke(); }
      x.fillStyle = "rgba(111,154,58,.7)"; oval(x, -5, 0, 2.4, 1); oval(x, 5, 1, 2.4, 1);
      x.restore();
    });
  }
  function malTierEinsatz(x, A, zeit) {
    A.plaetze.forEach(p => {
      const T = p.turm; if (!T || !T.tier || T.k !== "baer" || T.postX == null) return;
      x.save(); x.translate(T.postX, T.postY - 2);
      malBaerFigur(x, zeit, T.schlafT > 0, T.anim > 0, (T.blockiert && T.blockiert[0] ? T.blockiert[0].x < T.postX : p.x > T.postX));
      x.restore();
      if (T.schlafT > 0) { x.font = "700 11px " + FONT_B; x.fillStyle = "rgba(235,226,204,.75)"; x.textAlign = "center"; x.fillText("z", T.postX + 8, T.postY - 14 - (zeit * 10 % 12)); }
      else {
        const max = baerMaxHp(T), u = klemm((T.hp || max) / max, 0, 1);
        x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(T.postX - 12, T.postY - 22, 24, 4);
        x.fillStyle = u > 0.35 ? "#8ac24a" : "#c4564a"; x.fillRect(T.postX - 11, T.postY - 21, 22 * u, 2);
      }
    });
    A.ansturm.forEach(a => {
      x.save(); x.translate(a.x, a.y); x.rotate((a.w || 0) + Math.PI);
      x.fillStyle = "rgba(168,120,62,.25)"; oval(x, 14, 0, 16, 5);
      x.rotate(-((a.w || 0) + Math.PI)); x.scale(1.1, 1.1);
      const links = Math.cos(a.w || 0) > 0;
      x.save(); if (!links) x.scale(-1, 1); malTierFigur(x, "keiler", 0, null, a.t * 3); x.restore();
      x.restore();
      if (Math.random() < 0.5) S.teilchen.push({ x: a.x + zw(-6, 6), y: a.y + 6, vx: zw(-20, 20), vy: -20, t: 0, dauer: 0.4, farbe: "#8a6440", gr: 2.5 });
    });
  }

  /* --- Zauber im Bild --- */
  function malZauber(x, A, zeit) {
    if (A.mond) {
      const M = A.mond, a = Math.min(1, M.t / 0.2, (M.dauer - M.t) / 0.4);
      x.save(); x.globalAlpha = klemm(a, 0, 1);
      const g = x.createLinearGradient(0, 0, 0, M.y); g.addColorStop(0, "rgba(232,228,255,0)"); g.addColorStop(1, "rgba(232,228,255,.35)");
      x.fillStyle = g; x.beginPath(); x.moveTo(M.x - M.r * 0.5, 0); x.lineTo(M.x + M.r * 0.5, 0); x.lineTo(M.x + M.r, M.y); x.lineTo(M.x - M.r, M.y); x.fill();
      const g2 = x.createRadialGradient(M.x, M.y, 2, M.x, M.y, M.r); g2.addColorStop(0, "rgba(255,255,255,.55)"); g2.addColorStop(1, "rgba(200,196,255,.08)");
      x.fillStyle = g2; x.beginPath(); x.ellipse(M.x, M.y, M.r, M.r * 0.7, 0, 0, Math.PI * 2); x.fill();
      for (let i = 0; i < 5; i++) { const w = zeit * 2 + i * 1.26; x.fillStyle = "rgba(255,255,255,.7)"; kreis(x, M.x + Math.cos(w) * M.r * 0.7, M.y + Math.sin(w) * M.r * 0.45 - ((zeit * 30 + i * 9) % 30), 1.4); }
      x.restore();
    }
    if (A.adler) {
      const B = A.adler, w = Math.atan2(B.vy, B.vx), fl = Math.sin(B.t * 30) * 0.5;
      x.save(); x.translate(B.x, B.y); x.rotate(w);
      x.fillStyle = "rgba(201,163,90,.25)"; oval(x, -26, 0, 22, 4);
      x.fillStyle = "#6b4a2a";
      x.beginPath(); x.moveTo(-4, 0); x.quadraticCurveTo(-6, -18 - fl * 10, -16, -22 - fl * 8); x.quadraticCurveTo(-8, -8, -12, 0); x.fill();
      x.beginPath(); x.moveTo(-4, 0); x.quadraticCurveTo(-6, 18 + fl * 10, -16, 22 + fl * 8); x.quadraticCurveTo(-8, 8, -12, 0); x.fill();
      x.fillStyle = "#5a3a20"; oval(x, -4, 0, 11, 4.5);
      x.beginPath(); x.moveTo(-14, -3); x.lineTo(-22, 0); x.lineTo(-14, 3); x.fill();
      x.fillStyle = "#f1e7cf"; kreis(x, 7, 0, 3.6);
      x.fillStyle = "#e0a046"; x.beginPath(); x.moveTo(10, -1.4); x.lineTo(14, 0.5); x.lineTo(10, 1.4); x.fill();
      x.fillStyle = "#1a1210"; kreis(x, 8, -1.3, 0.8);
      x.restore();
    }
  }

  /* --- Freunde der Gruppe --- */
  const PORTRAETS = {};
  function portraetsLaden() {
    const q = { rex: ["rex-guckt.webp", 0.5, 0.45, 0.9], barradin: ["barradin.jpg", 0.47, 0.25, 0.34], ezekiel: ["ezekiel.jpg", 0.5, 0.16, 0.32] };
    Object.keys(q).forEach(k => {
      const [src, fx, fy, fs] = q[k], img = new Image(); img.decoding = "async";
      img.onload = () => {
        const n = 128, c = document.createElement("canvas"); c.width = n; c.height = n;
        const x = c.getContext("2d"), w = img.naturalWidth, h = img.naturalHeight, sz = Math.min(w, h) * fs;
        x.beginPath(); x.arc(n / 2, n / 2, n / 2, 0, Math.PI * 2); x.clip();
        x.drawImage(img, klemm(w * fx - sz / 2, 0, w - sz), klemm(h * fy - sz / 2, 0, h - sz), sz, sz, 0, 0, n, n);
        PORTRAETS[k] = c;
      };
      img.src = src;
    });
  }
  function malPortrait(x, A, zeit) {
    const P = A.portrait; if (!P) return;
    const ein = Math.min(1, P.t / 0.25), aus = P.t > 2.4 ? 1 - (P.t - 2.4) / 0.4 : 1, a = klemm(Math.min(ein, aus), 0, 1);
    const farbe = { rex: "#ebe2cc", barradin: "#e0a046", ezekiel: "#c4564a" }[P.art];
    const cx = 34 - (1 - ein) * 40, cy = 64;
    x.save(); x.globalAlpha = a;
    x.fillStyle = "rgba(9,8,15,.75)"; x.beginPath(); x.roundRect ? x.roundRect(cx - 28, cy - 28, 128, 56, 28) : x.rect(cx - 28, cy - 28, 128, 56); x.fill();
    if (PORTRAETS[P.art]) x.drawImage(PORTRAETS[P.art], cx - 24, cy - 24, 48, 48);
    else { x.fillStyle = farbe; kreis(x, cx, cy, 24); }
    x.strokeStyle = farbe; x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy, 24, 0, Math.PI * 2); x.stroke();
    x.font = "17px " + FONT_D; x.fillStyle = farbe; x.textAlign = "left"; x.textBaseline = "middle";
    x.fillText({ rex: "Rex", barradin: "Barradin", ezekiel: "Ezekiel" }[P.art], cx + 30, cy, 66);
    x.restore();
  }
  function malBarradin(x, bx, by, zeit) {
    const hop = Math.abs(Math.sin(zeit * 6)) * 1.5, zupf = Math.sin(zeit * 18) * 1.2;
    x.save(); x.translate(bx, by - hop);
    x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 0, 14 + hop, 9, 3);
    x.fillStyle = "#2a2018"; x.fillRect(-4, 4, 3, 10); x.fillRect(1, 4, 3, 10);
    x.fillStyle = "#3a2a1a"; x.fillRect(-5, 12, 4, 2.5); x.fillRect(1, 12, 4, 2.5);
    // Lederwams in Schwarz und Gold
    x.fillStyle = "#1e1a16"; x.beginPath(); x.moveTo(-6, -8); x.lineTo(6, -8); x.lineTo(7, 6); x.lineTo(-7, 6); x.closePath(); x.fill();
    x.strokeStyle = "#c9a35a"; x.lineWidth = 1; x.beginPath(); x.moveTo(-6, -8); x.lineTo(0, -2); x.lineTo(6, -8); x.moveTo(-7, 3); x.lineTo(7, 3); x.stroke();
    // Kopf mit Locken
    x.fillStyle = "#d8a888"; kreis(x, 0, -12, 4.6);
    x.fillStyle = "#6b4024"; for (const [hx, hy, r] of [[-4, -15, 2.6], [-1, -17, 2.8], [3, -16.5, 2.6], [5, -13, 2.2], [-5, -11.5, 2]]) kreis(x, hx, hy, r);
    x.fillStyle = "#2a1c12"; kreis(x, -1.6, -12, 0.6); kreis(x, 1.6, -12, 0.6);
    x.strokeStyle = "#8a3a2a"; x.lineWidth = 0.9; x.beginPath(); x.arc(0, -10.6, 1.8, 0.2, Math.PI - 0.2); x.stroke();
    // Laute
    x.save(); x.translate(3, -1); x.rotate(-0.55);
    x.strokeStyle = "#5a3a20"; x.lineWidth = 1.8; x.beginPath(); x.moveTo(0, 0); x.lineTo(-15, 0); x.stroke();
    x.fillStyle = "#3a2414"; x.fillRect(-18, -1.6, 3.5, 3.2);
    x.fillStyle = "#a8703a"; oval(x, 3, 0, 6.5, 5); x.fillStyle = "#2a1a10"; kreis(x, 2, 0, 1.6);
    x.restore();
    x.strokeStyle = "#d8a888"; x.lineWidth = 2; x.beginPath(); x.moveTo(5, -5); x.lineTo(6, 0 + zupf); x.stroke();
    x.restore();
  }
  function malEzekiel(x, ex, ey, links, a, zeit) {
    x.save(); x.translate(ex, ey); x.globalAlpha = a; if (links) x.scale(-1, 1);
    x.fillStyle = "rgba(0,0,0,.4)"; oval(x, 0, 12, 10, 3);
    // Umhang
    x.fillStyle = "#6a1814"; x.beginPath(); x.moveTo(-5, -9); x.quadraticCurveTo(-14, 2, -11, 12 + Math.sin(zeit * 9)); x.lineTo(7, 12); x.lineTo(5, -9); x.closePath(); x.fill();
    // Rüstung
    x.fillStyle = "#1a1414"; x.beginPath(); x.moveTo(-5, -9); x.lineTo(5, -9); x.lineTo(6, 6); x.lineTo(-6, 6); x.closePath(); x.fill();
    x.strokeStyle = "#7a2a20"; x.lineWidth = 0.9; x.beginPath(); x.moveTo(-4, -4); x.lineTo(4, -4); x.moveTo(-5, 1); x.lineTo(5, 1); x.stroke();
    x.fillStyle = "#1a1414"; x.fillRect(-4, 6, 3, 7); x.fillRect(1, 6, 3, 7);
    // Kapuze mit Hörnern
    x.fillStyle = "#9b2a20"; x.beginPath(); x.moveTo(-6, -8); x.quadraticCurveTo(-6, -19, 0, -20); x.quadraticCurveTo(6, -19, 6, -8); x.closePath(); x.fill();
    x.fillStyle = "#0a0606"; oval(x, 0, -12, 3.6, 4);
    x.save(); x.shadowColor = "#ff3a2a"; x.shadowBlur = 6; x.fillStyle = "#ff4a3a"; kreis(x, -1.3, -12.5, 0.8); kreis(x, 1.3, -12.5, 0.8); x.restore();
    x.strokeStyle = "#2a1c18"; x.lineWidth = 1.8; x.lineCap = "round";
    x.beginPath(); x.moveTo(-4, -17); x.quadraticCurveTo(-8, -21, -7, -26); x.moveTo(4, -17); x.quadraticCurveTo(8, -21, 7, -26); x.stroke();
    // zwei gebogene Klingen
    x.strokeStyle = "#d8d0c8"; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(7, -2); x.quadraticCurveTo(15, -6, 13, -14); x.stroke();
    x.beginPath(); x.moveTo(-7, 0); x.quadraticCurveTo(-15, 2, -15, -6); x.stroke();
    x.strokeStyle = "#c4564a"; x.lineWidth = 0.9; x.beginPath(); x.moveTo(13, -13); x.lineTo(12, -10); x.stroke();
    x.restore();
  }
  function malHelfer(x, A, zeit) {
    A.helfer.forEach(h => {
      if (h.art === "rex") {
        malWolf(x, h.x, h.y, h.links, zeit, false, REX_FARBEN, 1.25);
        if (h.zustand === "bellen") { x.font = "700 13px " + FONT_B; x.textAlign = "center"; x.fillStyle = "#ebe2cc"; x.fillText("Wuff!", h.x, h.y - 18 - Math.sin(zeit * 20) * 2); x.strokeStyle = "rgba(235,226,204,.5)"; x.lineWidth = 1.5; for (let r = 18; r < 70; r += 18) { x.beginPath(); x.arc(h.x, h.y, r + (zeit * 60 % 18), 0, Math.PI * 2); x.stroke(); } }
      } else if (h.art === "barradin") {
        const a = klemm(Math.min(h.t / 0.3, (7.2 - h.t) / 0.3), 0, 1);
        x.save(); x.globalAlpha = a; malBarradin(x, h.x, h.y, zeit); x.restore();
      } else if (h.art === "ezekiel" && h.i > 0) {
        const a = klemm(Math.min(h.sichtT / 0.08, 1) * (h.i >= h.ziele.length ? klemm(1 + h.schlagT / 0.6, 0, 1) : 1), 0, 1);
        malEzekiel(x, h.x, h.y, h.links, a, zeit);
      }
    });
  }

  /* --- Geschosse der Wächter --- */
  function malGeschoss(x, g, zeit) {
    if (g.art === "dorn") {
      x.save(); x.translate(g.x, g.y); x.rotate(g.w);
      x.strokeStyle = "rgba(207,230,168,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(-6, 0); x.lineTo(-16, 0); x.stroke();
      const l = 8 + (g.st || 0) * 1.5;
      x.fillStyle = "#2f4a1c"; x.beginPath(); x.moveTo(l, 0); x.lineTo(-4, -2.6); x.lineTo(-6, 0); x.lineTo(-4, 2.6); x.closePath(); x.fill();
      x.fillStyle = "#cfe6a8"; x.beginPath(); x.moveTo(l, 0); x.lineTo(l - 4, -1); x.lineTo(l - 4, 1); x.fill();
      x.restore();
    } else if (g.art === "splitter") {
      x.save(); x.translate(g.x, g.y);
      x.strokeStyle = "rgba(207,234,244,.45)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, 0); x.lineTo(-Math.cos(g.w) * 10, -Math.sin(g.w) * 10); x.stroke();
      x.rotate(g.dreh); x.shadowColor = "#cfeaf4"; x.shadowBlur = 8;
      x.fillStyle = "#e6f6fc"; x.beginPath(); x.moveTo(0, -5); x.lineTo(2.6, 0); x.lineTo(0, 5); x.lineTo(-2.6, 0); x.closePath(); x.fill();
      x.fillStyle = "#7fb8d4"; x.beginPath(); x.moveTo(0, -5); x.lineTo(2.6, 0); x.lineTo(0, 0.5); x.closePath(); x.fill();
      x.restore();
    } else if (g.art === "spore") {
      const u = Math.min(1, g.t / g.dauer);
      x.fillStyle = "rgba(0,0,0,.25)"; oval(x, g.x0 + (g.x1 - g.x0) * u, g.y0 + (g.y1 - g.y0) * u + 4, 5, 2);
      x.save(); x.translate(g.x, g.y); x.rotate(zeit * 5);
      x.shadowColor = "#c49ae0"; x.shadowBlur = 8;
      x.fillStyle = "rgba(196,154,224,.85)"; kreis(x, 0, 0, 4.5); kreis(x, 3, -2, 3); kreis(x, -3, 2, 3);
      x.fillStyle = "rgba(241,231,207,.8)"; kreis(x, -1, -1.5, 1.2);
      x.restore();
      if (Math.random() < 0.4) S.teilchen.push({ x: g.x, y: g.y, vx: (Math.random() - 0.5) * 20, vy: -30, t: 0, dauer: 0.5, farbe: "#c49ae0", gr: 2 });
    } else if (g.art === "wolf") {
      malWolf(x, g.x, g.y, g.links, zeit * (g.zustand === "hin" ? 1 : 0.8), g.zustand === "hin", null, g.alpha ? 1.7 : 1);
    }
  }
  const WOLF_FARBEN = { bein: "#6a655c", koerper: "#8a847a", schwanz: "#6a655c", kopf: "#a8a296", ohr: "#6a655c" };
  const REX_FARBEN = { bein: "#b07a40", koerper: "#2a2422", schwanz: "#2a2422", kopf: "#2a2422", ohr: "#1a1412", brust: "#f1e7cf", maske: "#b07a40" };
  function malWolf(x, wx, wy, links, zeit, wild, F, gr) {
    F = F || WOLF_FARBEN;
    x.save(); x.translate(wx, wy); if (gr) x.scale(gr, gr); if (!links) x.scale(-1, 1);
    x.fillStyle = "rgba(0,0,0,.3)"; oval(x, 0, 6, 10, 2.5);
    const lauf = Math.sin(zeit * 26);
    x.strokeStyle = F.bein; x.lineWidth = 2; x.lineCap = "round";
    x.beginPath(); x.moveTo(-5, 1); x.lineTo(-7 + lauf * 3, 6); x.moveTo(-3, 1); x.lineTo(-1 - lauf * 3, 6); x.moveTo(4, 1); x.lineTo(2 + lauf * 3, 6); x.moveTo(6, 1); x.lineTo(8 - lauf * 3, 6); x.stroke();
    x.fillStyle = F.koerper; oval(x, 0, -1, 8, 4);
    if (F.brust) { x.fillStyle = F.brust; oval(x, -5, 0, 3.5, 3); }
    x.fillStyle = F.schwanz; x.beginPath(); x.moveTo(7, -2); x.quadraticCurveTo(13, -6 + lauf, 14, -1); x.lineTo(8, 0); x.fill();
    x.fillStyle = F.kopf; kreis(x, -8, -3, 3.6);
    x.beginPath(); x.moveTo(-10, -2); x.lineTo(-14.5, -1); x.lineTo(-10, 0.5); x.fill();
    if (F.maske) { x.fillStyle = F.brust; x.beginPath(); x.moveTo(-10, -2.5); x.lineTo(-14.5, -1); x.lineTo(-10, 0.5); x.fill(); x.fillStyle = F.maske; kreis(x, -9.3, -4.6, 1.1); }
    x.fillStyle = F.ohr; x.beginPath(); x.moveTo(-9, -5); x.lineTo(-8.5, -9); x.lineTo(-6.5, -5.5); x.fill();
    x.fillStyle = wild ? "#ffd34d" : "#2a2118"; kreis(x, -9.5, -3.5, 0.8);
    x.restore();
  }

  /* --- der Hort mit Echo --- */
  function malHort(x, A, zeit) {
    const anteil = klemm(A.hort / Math.max(1, A.hortStart), 0, 1);
    x.save(); x.translate(HORT.x, HORT.y);
    x.fillStyle = "rgba(0,0,0,.4)"; oval(x, 0, 12, 36, 10);
    const h = 6 + anteil * 16;
    const g = x.createLinearGradient(0, -h, 0, 10); g.addColorStop(0, "#fff0a0"); g.addColorStop(0.5, "#ffd34d"); g.addColorStop(1, "#a8701e");
    x.fillStyle = g; x.beginPath(); x.moveTo(-32, 10); x.quadraticCurveTo(-20, -h, 0, -h - 2); x.quadraticCurveTo(20, -h, 32, 10); x.closePath(); x.fill();
    const rr = lcg(5);
    for (let i = 0; i < 14 * anteil + 2; i++) { x.fillStyle = rr() < 0.5 ? "#ffe680" : "#c98a3a"; oval(x, rr() * 50 - 25, 6 - rr() * h, 3, 1.4); }
    if (anteil > 0.3) { x.fillStyle = "#c4564a"; kreis(x, -8, -h * 0.5, 2); x.fillStyle = "#4aa0b0"; kreis(x, 10, -h * 0.4, 2); }
    x.fillStyle = "rgba(255,255,255," + (0.3 + Math.sin(zeit * 3) * 0.3) + ")"; kreis(x, 6, -h * 0.7, 1.4);
    x.restore();
    malEcho(x, HORT.x + 40, HORT.y - 4, 0.85, "ranke", A.zorn, zeit);
    // Ladung des gewählten Zaubers als Ring um Echo
    const z = A.zauber[A.aktiv]; if (!z) return;
    const u = 1 - z.cd / z.max, farbe = ZAUBER[z.k].farbe;
    x.strokeStyle = u >= 1 ? farbe : "rgba(235,226,204,.25)"; x.lineWidth = 2.5;
    x.beginPath(); x.arc(HORT.x + 40, HORT.y - 4, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u); x.stroke();
    if (u >= 1) { x.save(); x.shadowColor = farbe; x.shadowBlur = 10; x.fillStyle = farbe; kreis(x, HORT.x + 56, HORT.y - 18, 3 + Math.sin(zeit * 8)); x.restore(); }
  }

  function malBaer(x, B, zeit) {
    x.save(); x.translate(B.x, B.y); x.rotate((B.w || 0) + Math.PI / 2 + Math.PI);
    x.fillStyle = "rgba(196,86,74,.25)"; kreis(x, 0, 0, 26);
    x.restore();
    malEcho(x, B.x, B.y, 0.9, "baer", 100, zeit);
  }

  /* --- Effekte, Texte, Anzeigen --- */
  function malEffekte(x, zeit) {
    S.blitze.forEach(b => {
      const u = b.t / b.dauer, a = 1 - u;
      x.save();
      if (b.art === "aufwertung") {
        const k = b.klein ? 0.65 : 1, h = 70 * k * Math.min(1, u * 3);
        const g = x.createLinearGradient(0, b.y + 6, 0, b.y - h);
        g.addColorStop(0, "rgba(255,211,77," + (a * 0.55) + ")"); g.addColorStop(1, "rgba(255,211,77,0)");
        x.globalCompositeOperation = "lighter"; x.fillStyle = g; x.fillRect(b.x - 11 * k, b.y - h, 22 * k, h + 6);
        x.strokeStyle = "rgba(255,226,140," + a + ")"; x.lineWidth = 2.2 * k;
        x.beginPath(); x.ellipse(b.x, b.y + 5, (12 + u * 30) * k, (5 + u * 12) * k, 0, 0, Math.PI * 2); x.stroke();
        for (let i = 0; i < 7; i++) { const w = i / 7 * Math.PI * 2 + b.t * 2; x.fillStyle = "rgba(255,240,180," + a + ")"; kreis(x, b.x + Math.cos(w) * 14 * k, b.y - u * 46 * k - (i % 3) * 6, 1.6); }
      } else if (b.art === "explosion") {
        const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * (0.5 + u * 0.6));
        g.addColorStop(0, "rgba(255,240,160," + a + ")"); g.addColorStop(0.4, "rgba(255,138,58," + a * 0.8 + ")"); g.addColorStop(1, "rgba(196,86,74,0)");
        x.fillStyle = g; kreis(x, b.x, b.y, b.r * (0.5 + u * 0.6));
      } else if (b.art === "blitz") {
        const r = lcg(Math.floor(b.seed * 1e6) + Math.floor(zeit * 30));
        x.strokeStyle = "rgba(243,226,122," + a + ")"; x.lineWidth = b.dick ? 5 : 2.5; x.shadowColor = "#f3e27a"; x.shadowBlur = b.dick ? 18 : 10;
        x.beginPath(); x.moveTo(b.x1, b.y1);
        for (let i = 1; i < 7; i++) { const v = i / 7; x.lineTo(b.x1 + (b.x2 - b.x1) * v + (r() - 0.5) * 16, b.y1 + (b.y2 - b.y1) * v + (r() - 0.5) * 16); }
        x.lineTo(b.x2, b.y2); x.stroke();
      } else if (b.art === "frost") {
        x.strokeStyle = "rgba(159,214,236," + a + ")"; x.lineWidth = 3; x.beginPath(); x.arc(b.x, b.y, b.r * (0.3 + u * 0.7), 0, Math.PI * 2); x.stroke();
        x.fillStyle = "rgba(159,214,236," + a * 0.12 + ")"; kreis(x, b.x, b.y, b.r * (0.3 + u * 0.7));
      } else if (b.art === "ring") {
        x.strokeStyle = "rgba(138,100,64," + a + ")"; x.lineWidth = 2.5; x.beginPath(); x.arc(b.x, b.y, b.r * (0.3 + u * 0.7), 0, Math.PI * 2); x.stroke();
      } else if (b.art === "biss") {
        x.strokeStyle = "rgba(235,226,204," + a + ")"; x.lineWidth = 2;
        for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(b.x - 7, b.y - 7 + i * 4); x.lineTo(b.x + 7, b.y + 3 + i * 4); x.stroke(); }
      } else if (b.art === "sporen") {
        for (let i = 0; i < 10; i++) { const w = i / 10 * Math.PI * 2 + u; x.fillStyle = "rgba(196,154,224," + a * 0.8 + ")"; kreis(x, b.x + Math.cos(w) * b.r * u, b.y + Math.sin(w) * b.r * u, 2.2); }
      } else if (b.art === "wurzelstich") {
        const h = Math.sin(Math.min(1, u * 1.6) * Math.PI) * 13, r = lcg(Math.floor(b.seed * 1e6));
        x.fillStyle = "rgba(40,28,18," + a * 0.6 + ")"; oval(x, b.x, b.y + 5, 10, 3.5);
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * 6 + (r() - 0.5) * 2, hh = h * (0.7 + r() * 0.5);
          x.fillStyle = "#6b4a30"; x.beginPath(); x.moveTo(b.x + ox - 2.6, b.y + 5); x.quadraticCurveTo(b.x + ox - 1, b.y + 5 - hh * 0.6, b.x + ox + (i - 1) * 2, b.y + 5 - hh); x.lineTo(b.x + ox + 2.6, b.y + 5); x.fill();
        }
      } else if (b.art === "tod") {
        x.strokeStyle = "rgba(235,226,204," + a * 0.6 + ")"; x.lineWidth = 1.5; x.beginPath(); x.arc(b.x, b.y, b.r + u * 14, 0, Math.PI * 2); x.stroke();
        x.fillStyle = "rgba(20,16,12," + a * 0.35 + ")"; kreis(x, b.x, b.y - u * 8, b.r * (1 - u * 0.5));
      } else if (b.art === "prankenhieb") {
        x.strokeStyle = "rgba(255,240,220," + a + ")"; x.lineWidth = 2; x.lineCap = "round";
        for (let i = -1; i <= 1; i++) { x.beginPath(); x.arc(b.x + (b.links ? -6 : 6), b.y - 4 + i * 4, 10, b.links ? 2.4 : -0.7, b.links ? 3.9 : 0.8); x.stroke(); }
      } else if (b.art === "stoss") {
        x.strokeStyle = "rgba(216,168,104," + a + ")"; x.lineWidth = 3; x.beginPath(); x.moveTo(b.x0, b.y0); x.lineTo(b.x, b.y); x.stroke();
        x.fillStyle = "rgba(255,240,200," + a * 0.6 + ")"; kreis(x, b.x, b.y, 8 + u * 10);
      } else if (b.art === "falle") {
        x.strokeStyle = "rgba(168,131,92," + a + ")"; x.lineWidth = 2; for (let i = 0; i < 6; i++) { const w = i / 6 * Math.PI * 2; x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(b.x + Math.cos(w) * (6 + u * 10), b.y + Math.sin(w) * (4 + u * 6) - u * 6); x.stroke(); }
      } else if (b.art === "riss") {
        const r = lcg(Math.floor(b.seed * 1e6)); x.strokeStyle = "rgba(30,20,12," + a + ")"; x.lineWidth = 2.2;
        x.beginPath(); let px = b.x - 18, py = b.y; x.moveTo(px, py); for (let i = 0; i < 6; i++) { px += 6; py += (r() - 0.5) * 9; x.lineTo(px, py); } x.stroke();
        x.fillStyle = "rgba(168,120,62," + a * 0.5 + ")"; for (let i = 0; i < 4; i++) kreis(x, b.x + (r() - 0.5) * 30, b.y + (r() - 0.5) * 10 - u * 10, 2);
      } else if (b.art === "schnitt") {
        x.strokeStyle = "rgba(255,90,70," + a + ")"; x.lineWidth = 2.5 * a + 0.5; x.lineCap = "round";
        const l = 9 + u * 6;
        x.beginPath(); x.moveTo(b.x - l, b.y - l); x.lineTo(b.x + l, b.y + l); x.moveTo(b.x + l, b.y - l * 0.8); x.lineTo(b.x - l * 0.8, b.y + l); x.stroke();
      } else if (b.art === "sporenwolke") {
        for (let i = 0; i < 7; i++) { const w = i / 7 * Math.PI * 2 + b.t * 2, rr = b.r * (0.25 + u * 0.75); x.fillStyle = "rgba(196,154,224," + a * 0.45 + ")"; kreis(x, b.x + Math.cos(w) * rr * 0.6, b.y + Math.sin(w) * rr * 0.45, 7 + u * 5); }
      } else if (b.art === "gift") {
        x.fillStyle = "rgba(120,190,70," + a * 0.3 + ")"; kreis(x, b.x, b.y, b.r * (0.4 + u * 0.6));
      }
      x.restore();
    });
    S.teilchen.forEach(p => { x.globalAlpha = klemm(1 - p.t / p.dauer, 0, 1); x.fillStyle = p.farbe; x.fillRect(p.x - p.gr / 2, p.y - p.gr / 2, p.gr, p.gr); });
    x.globalAlpha = 1;
    x.textAlign = "center"; x.textBaseline = "middle";
    S.texte.forEach(tx => {
      const u = tx.t / tx.dauer;
      x.globalAlpha = klemm(1.4 - u * 1.4, 0, 1);
      x.font = "700 " + tx.gross + "px " + FONT_B;
      if (tx.bx == null) { const bw = Math.min(W - 12, x.measureText(tx.s).width); tx.bx = klemm(tx.x, bw / 2 + 6, W - bw / 2 - 6); }
      x.lineWidth = 3; x.strokeStyle = "rgba(9,8,15,.85)"; x.strokeText(tx.s, tx.bx, tx.y - u * 26, W - 12);
      x.fillStyle = tx.farbe; x.fillText(tx.s, tx.bx, tx.y - u * 26, W - 12);
    });
    x.globalAlpha = 1;
    if (S.banner) {
      const b = S.banner, u = b.t / b.dauer, a = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1;
      x.globalAlpha = klemm(a, 0, 1);
      x.fillStyle = "rgba(9,8,15,.6)"; x.fillRect(0, 200, W, 56);
      x.font = "30px " + FONT_D; x.fillStyle = b.farbe; x.fillText(b.s, W / 2, 229, W - 20);
      x.globalAlpha = 1;
    }
  }
  function sprechblase(x, s, cx, cy) {
    x.font = "600 18px " + FONT_H;
    const b = x.measureText(s).width + 16;
    const bx = klemm(cx - b / 2, 6, W - 6 - b);
    x.fillStyle = "rgba(241,231,207,.95)"; x.strokeStyle = "rgba(42,33,24,.6)"; x.lineWidth = 1;
    x.beginPath(); x.roundRect ? x.roundRect(bx, cy - 13, b, 26, 8) : x.rect(bx, cy - 13, b, 26); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(cx - 10, cy + 12); x.lineTo(cx - 18, cy + 22); x.lineTo(cx - 2, cy + 12); x.fill();
    x.fillStyle = "#2a2118"; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText(s, bx + 8, cy + 1);
  }
  function balken(x, bx, by, bw, bh, u, farbe, label) {
    x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(bx, by, bw, bh);
    x.fillStyle = farbe; x.fillRect(bx + 1, by + 1, (bw - 2) * klemm(u, 0, 1), bh - 2);
    if (label) { x.font = "600 9px " + FONT_B; x.fillStyle = "#ebe2cc"; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText(label, bx + 4, by + bh / 2 + 0.5); }
  }
  function hudText(x, s, px, farbe, gr) {
    x.font = "700 " + (gr || 13) + "px " + FONT_B; x.textAlign = "left"; x.textBaseline = "middle";
    x.fillStyle = farbe || "#ebe2cc"; x.fillText(s, px, 14);
    return px + x.measureText(s).width;
  }
  function knopf(x, id, bx, by, bw, bh, zeilen, an, aus, farbe) {
    S.knoepfe.push({ id, x: bx, y: by, w: bw, h: bh, aus });
    x.fillStyle = an ? "rgba(224,160,70,.26)" : "rgba(235,226,204,.07)";
    x.strokeStyle = an ? "#e0a046" : "rgba(235,226,204,.22)"; x.lineWidth = 1;
    x.beginPath(); x.roundRect ? x.roundRect(bx, by, bw, bh, 6) : x.rect(bx, by, bw, bh); x.fill(); x.stroke();
    x.globalAlpha = aus ? 0.4 : 1;
    x.textAlign = "center"; x.textBaseline = "middle";
    if (zeilen.length === 1) { x.font = "700 13px " + FONT_B; x.fillStyle = farbe || "#ebe2cc"; x.fillText(zeilen[0], bx + bw / 2, by + bh / 2 + 1, bw - 6); }
    else {
      x.font = (zeilen[0].length > 3 ? "700 13px " : "18px ") + FONT_B; x.fillStyle = "#ebe2cc"; x.fillText(zeilen[0], bx + bw / 2, by + bh / 2 - 7, bw - 6);
      x.font = "600 10px " + FONT_B; x.fillStyle = farbe || "#a89f8f"; x.fillText(zeilen[1], bx + bw / 2, by + bh / 2 + 12, bw - 4);
    }
    x.globalAlpha = 1;
  }

  /* --- Zielstrahl: zeigt, was die Ranke als Erstes packen würde --- */
  function zielInfo(R) {
    const w = R.haken.winkel, dx = Math.sin(w), dy = Math.cos(w);
    let len = reichweite();
    if (dx < -1e-3) len = Math.min(len, (6 - DREH.x) / dx);
    if (dx > 1e-3) len = Math.min(len, (W - 6 - DREH.x) / dx);
    len = Math.min(len, (LEISTE - 6 - DREH.y) / dy);
    let treffer = null;
    R.dinge.forEach(d => {
      if (d.flieht) return;
      const rx = d.x - DREH.x, ry = d.y - DREH.y, entlang = rx * dx + ry * dy, quer = Math.abs(rx * dy - ry * dx);
      if (entlang > 0 && entlang - d.r < len && quer < d.r + 5) { const l = Math.max(0, entlang - Math.sqrt(Math.max(0, (d.r + 5) ** 2 - quer * quer))); if (l < len) { len = l; treffer = d; } }
    });
    return { d: treffer, len, dx, dy };
  }
  function zielArt(R, d) {
    if (!d) return "leer";
    const f = formDaten();
    if (d.typ === "tier" || d.typ === "stoerer" || d.typ === "stein") return "schlecht";
    if ((d.block === "fels" && !f.fels) || (d.block === "netz" && !f.netz) || (f.maxGewicht && d.gewicht > f.maxGewicht)) return "gesperrt";
    return "gut";
  }
  function malZielstrahl(x, R, zeit) {
    /* nur ein gut sichtbarer Strahl in Wurfrichtung – wohin genau er trifft, muss man selbst einschätzen */
    const w = R.haken.winkel, dx = Math.sin(w), dy = Math.cos(w);
    let len = reichweite();
    if (dx < -1e-3) len = Math.min(len, (6 - DREH.x) / dx);
    if (dx > 1e-3) len = Math.min(len, (W - 6 - DREH.x) / dx);
    len = Math.min(len, (LEISTE - 6 - DREH.y) / dy);
    const ex = DREH.x + dx * len, ey = DREH.y + dy * len;
    x.save(); x.lineCap = "round";
    const g = x.createLinearGradient(DREH.x, DREH.y, ex, ey);
    g.addColorStop(0, "rgba(207,230,168,.32)"); g.addColorStop(1, "rgba(207,230,168,0)");
    x.strokeStyle = g; x.lineWidth = 8; x.beginPath(); x.moveTo(DREH.x, DREH.y); x.lineTo(ex, ey); x.stroke();
    const g2 = x.createLinearGradient(DREH.x, DREH.y, ex, ey);
    g2.addColorStop(0, "rgba(235,240,210,.95)"); g2.addColorStop(0.75, "rgba(235,240,210,.55)"); g2.addColorStop(1, "rgba(235,240,210,0)");
    x.strokeStyle = g2; x.lineWidth = 2.2; x.setLineDash([8, 6]); x.lineDashOffset = -zeit * 30;
    x.beginPath(); x.moveTo(DREH.x, DREH.y); x.lineTo(ex, ey); x.stroke(); x.setLineDash([]);
    x.restore();
  }


  /* --- Raubzug zeichnen --- */
  function zeichneRaub(x, zeit) {
    const R = S.R, h = R.haken, T = t();
    x.drawImage(hgBild, 0, 0, W, H);
    // Wurzelknoten am Drehpunkt
    x.fillStyle = "#3b2a1b"; oval(x, DREH.x, DREH.y - 2, 14, 7);
    x.fillStyle = "#5a4430"; oval(x, DREH.x, DREH.y - 4, 9, 4);
    // Echo
    const aussen = h.zustand !== "schwingen" && (R.form === "rabe" || R.form === "ratte");
    if (!aussen) malEcho(x, DREH.x, 62, 1.25, R.form === "ranke" ? "ranke" : R.form, R.zorn, zeit);
    else { x.fillStyle = "rgba(207,230,168,.25)"; kreis(x, DREH.x, 62, 10 + Math.sin(zeit * 8) * 3); }
    if (R.schmollT > 0) { x.font = "18px " + FONT_B; x.textAlign = "center"; x.fillText("💢", DREH.x + 22, 36 + Math.sin(zeit * 6) * 2); }
    // Zielhilfe
    regelMalUnten(x, R, zeit);
    R.dinge.forEach(d => malDing(x, d, zeit));
    regelMalOben(x, R, zeit);
    if (h.zustand === "schwingen" && !R.fertig && R.schmollT <= 0) malZielstrahl(x, R, zeit);
    malRanke(x, R, zeit);
    if (h.last) malDing(x, h.last, zeit);
    if (h.last2) malDing(x, h.last2, zeit);
    lichtRaub(x, R, zeit);
    glitzern(x, R, zeit);
    malEffekte(x, zeit);
    if (S.quip && S.quip.t < 2) sprechblase(x, S.quip.s, DREH.x + 70, 40);
    // oben: Anzeigen
    leisteOben(x);
    let px = 8;
    px = hudText(x, "⏳ " + Math.ceil(R.zeit), px, R.zeit < 8 ? "#c4564a" : "#ebe2cc") + 10;
    balken(x, px, 7, 76, 14, R.zorn / 100, R.zorn > 75 ? "#c4564a" : "#9b5a3a", T.hud.zorn); px += 86;
    px = hudText(x, "💰 " + R.beute, px, "#ffd34d") + 6;
    if (R.gier) px = hudText(x, "×" + (1 + 0.15 * R.gier).toFixed(2).replace(/0$/, ""), px, "#e0a046", 11) + 8; else px += 4;
    hudText(x, "🌱 " + Math.round(R.saat), px, "#cfe6a8");
    // unten: Gestalten
    leisteUnten(x);
    S.knoepfe = [];
    const frei = FORMEN_REIHE.filter(k => S.lv >= FORMEN[k].ab);
    const bw = 58;
    frei.forEach((k, i) => {
      const an = R.form === k;
      const zweite = an && k !== "ranke" ? "●".repeat(Math.max(0, R.formWuerfe)) : T.formen[k][0];
      knopf(x, "form:" + k, 6 + i * (bw + 4), LEISTE + 4, bw, H - LEISTE - 8, [FORMEN[k].sym, zweite], an, k !== "ranke" && !an && R.wild <= 0, an ? "#e0a046" : null);
    });
    const wx = 6 + frei.length * (bw + 4) + 4;
    x.font = "700 12px " + FONT_B; x.textAlign = "left"; x.textBaseline = "middle"; x.fillStyle = R.wild > 0 ? "#cfe6a8" : "#6a6256";
    x.fillText("🦌×" + R.wild, wx, LEISTE + 26);
    knopf(x, "genug", W - 82, LEISTE + 4, 76, H - LEISTE - 8, [T.hud.genug], false, R.fertig, "#e0a046");
  }

  /* --- Abwehr zeichnen --- */
  /* Gefahrenkarte: was bringt die nächste Welle? */
  function gefahrDaten(A) {
    const l = A.wellen[A.welle + 1]; if (!l) return null;
    if (A.gefahrCache && A.gefahrCache.w === A.welle) return A.gefahrCache.d;
    const d = { flug: 0, schnell: 0, zaeh: 0, unsichtbar: 0, boss: 0 };
    l.forEach(k => { const f = FEINDE[k]; if (!f) return; if (f.boss) d.boss++; else { if (f.flug) d.flug++; if (f.v >= 48) d.schnell++; if (f.hp >= 150) d.zaeh++; if (f.unsichtbar) d.unsichtbar++; } });
    if (A.demo && A.welle + 1 === A.wellen.length - 1) d.boss++;
    A.gefahrCache = { w: A.welle, d };
    return d;
  }
  const GEFAHR_SYM = { flug: "🦇", schnell: "💨", zaeh: "🛡️", unsichtbar: "👻", boss: "☠️" };
  function malGefahr(x, A, d) {
    if (!d) return;
    const teile = Object.keys(GEFAHR_SYM).filter(k => d[k] > 0).map(k => GEFAHR_SYM[k] + (k === "boss" ? "" : d[k]));
    if (!teile.length) return;
    const st = A.P.p[0];
    x.save(); x.font = "700 11px " + FONT_B;
    const txt = teile.join("  "), tw = Math.max(x.measureText(txt).width, x.measureText(t().gefahr).width) + 16;
    const bx = klemm(st.x - tw / 2, 6, W - tw - 6), by = 34;
    x.fillStyle = "rgba(18,14,11,.82)"; x.strokeStyle = d.boss ? "#c4564a" : "rgba(224,160,70,.7)"; x.lineWidth = 1;
    x.beginPath(); x.roundRect ? x.roundRect(bx, by, tw, 32, 6) : x.rect(bx, by, tw, 32); x.fill(); x.stroke();
    x.textAlign = "center"; x.textBaseline = "middle";
    x.font = "600 9px " + FONT_B; x.fillStyle = "#a89f8f"; x.fillText(t().gefahr.toUpperCase(), bx + tw / 2, by + 9);
    x.font = "700 11px " + FONT_B; x.fillStyle = "#ebe2cc"; x.fillText(txt, bx + tw / 2, by + 22);
    x.restore();
  }
  function malFlugschneise(x, A, zeit) {
    const P = A.P, o = flugSchneise(P, 20), u = flugSchneise(P, HORT.y - 10);
    x.save();
    x.fillStyle = "rgba(159,214,236,.06)";
    x.beginPath(); x.moveTo(o.links, 20); x.lineTo(o.rechts, 20); x.lineTo(u.rechts, HORT.y - 10); x.lineTo(u.links, HORT.y - 10); x.closePath(); x.fill();
    x.strokeStyle = "rgba(159,214,236,.28)"; x.setLineDash([4, 6]); x.lineDashOffset = -zeit * 20; x.lineWidth = 1;
    x.beginPath(); x.moveTo(o.links, 20); x.lineTo(u.links, HORT.y - 10); x.moveTo(o.rechts, 20); x.lineTo(u.rechts, HORT.y - 10); x.stroke();
    x.restore();
  }
  function zeichneAbwehr(x, zeit) {
    const A = S.A, T = t();
    x.drawImage(hgBild, 0, 0, W, H);
    teicheMalen(x, A, zeit);
    ambientMalen(x, A, zeit);
    // Pflanzplätze
    const bauZeit = (A.vorT > 0 || A.halt) && A.saat >= kosten("dorn", 0);
    const gef = A.vorT > 0 ? gefahrDaten(A) : null, fliegerKommen = gef && gef.flug > 0;
    if (fliegerKommen) malFlugschneise(x, A, zeit);
    A.plaetze.forEach((p, i) => {
      if (p.turm) return;
      const gew = A.wahl === i, puls = 0.5 + Math.sin(zeit * 2.4 + i) * 0.5;
      if (!gew && !bauZeit) { // ruhig: nur ein zarter Ring
        x.strokeStyle = "rgba(207,230,168,.13)"; x.lineWidth = 1; x.beginPath(); x.ellipse(p.x, p.y + 4, 13, 6, 0, 0, Math.PI * 2); x.stroke();
        blatt(x, p.x, p.y + 3, -2.2, 4, 1.6, "rgba(111,154,58,.6)"); blatt(x, p.x, p.y + 3, -0.9, 4, 1.6, "rgba(138,176,74,.6)");
        return;
      }
      x.fillStyle = gew ? "rgba(224,160,70,.32)" : "rgba(170,210,120," + (0.06 + puls * 0.08) + ")"; oval(x, p.x, p.y + 4, 14, 6.5);
      x.strokeStyle = gew ? "#e0a046" : fliegerKommen && p.luftNah ? "rgba(159,214,236," + (0.35 + puls * 0.4) + ")" : "rgba(207,230,168," + (0.18 + puls * 0.25) + ")"; x.lineWidth = gew ? 2 : fliegerKommen && p.luftNah ? 1.8 : 1.2;
      x.beginPath(); x.ellipse(p.x, p.y + 4, 14, 6.5, 0, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = "rgba(111,154,58,.85)"; x.lineWidth = 1.4; x.beginPath(); x.moveTo(p.x, p.y + 5); x.lineTo(p.x, p.y - 1); x.stroke();
      blatt(x, p.x, p.y, -2.4, 5, 2, "#6f9a3a"); blatt(x, p.x, p.y - 1, -0.6, 5, 2, "#8ab04a");
    });
    malFallen(x, A, zeit);
    A.plaetze.forEach((p, i) => { if (p.turm) malWachter(x, p, zeit, A.wahl === i); });
    malHort(x, A, zeit);
    A.feinde.slice().sort((a, b) => a.y - b.y).forEach(e => malFeind(x, e, zeit));
    A.geschosse.forEach(g => {
      if (g.art === "dorn" || g.art === "splitter" || g.art === "spore" || g.art === "wolf") malGeschoss(x, g, zeit);
      else if (g.art === "falke") {
        const fl = Math.sin(g.t * 26) * 0.5;
        x.save(); x.translate(g.x, g.y); x.rotate(g.w || 0);
        x.fillStyle = "#4a5866";
        x.beginPath(); x.moveTo(-2, 0); x.quadraticCurveTo(-4, -13 - fl * 6, -12, -15 - fl * 4); x.quadraticCurveTo(-6, -5, -9, 0); x.fill();
        x.beginPath(); x.moveTo(-2, 0); x.quadraticCurveTo(-4, 13 + fl * 6, -12, 15 + fl * 4); x.quadraticCurveTo(-6, 5, -9, 0); x.fill();
        x.fillStyle = "#5a6a7a"; oval(x, -2, 0, 8, 3.4); x.fillStyle = "#efe2c4"; oval(x, -1, 1, 5, 1.6);
        x.fillStyle = "#3a4450"; kreis(x, 5, 0, 3); x.fillStyle = "#e0b030"; x.beginPath(); x.moveTo(7.5, -1); x.lineTo(10.5, 0.5); x.lineTo(7.5, 1.2); x.fill();
        x.restore();
      }
      else if (g.art === "gold") { x.save(); x.shadowColor = "#ffd34d"; x.shadowBlur = 10; x.fillStyle = "#ffd34d"; for (let i = 0; i < 4; i++) oval(x, g.x + Math.cos(zeit * 9 + i * 1.6) * 5, g.y + Math.sin(zeit * 9 + i * 1.6) * 3, 3, 1.6); x.restore(); }
      else if (g.art === "feuerball") { x.save(); x.shadowColor = "#ff8a3a"; x.shadowBlur = 16; x.fillStyle = "#ffd27a"; kreis(x, g.x, g.y, 6); x.fillStyle = "#ff8a3a"; kreis(x, g.x, g.y, 3.5); x.restore(); funken(g.x, g.y, 1, ["#ff8a3a", "#e0a046"], 20, 2); }
      else if (g.art === "fels") { x.fillStyle = "#6a6458"; kreis(x, g.x, g.y, 7); x.fillStyle = "#8a8476"; kreis(x, g.x - 2, g.y - 2, 3); }
    });
    malTierEinsatz(x, A, zeit);
    if (A.baer) malBaer(x, A.baer, zeit);
    malHelfer(x, A, zeit);
    malZauber(x, A, zeit);
    lichtAbwehr(x, A, zeit);
    malEffekte(x, zeit);
    malPortrait(x, A, zeit);
    if (S.quip && S.quip.t < 2) sprechblase(x, S.quip.s, HORT.x + 60, HORT.y - 54);
    // Vorbereitung
    if (A.vorT > 0) malGefahr(x, A, gef);
    if (A.vorT > 0 && A.wahl < 0) {
      const erste = A.welle < 0, zn = zinsen(A.saat), h2 = (erste ? 74 : 40) + (zn > 0 ? (erste ? 30 : 18) : 0);
      x.fillStyle = "rgba(9,8,15,.55)"; x.fillRect(20, 150, W - 40, h2);
      x.textAlign = "center"; x.textBaseline = "middle";
      x.font = "22px " + FONT_D; x.fillStyle = "#e0a046"; x.fillText(A.halt ? T.welleBereit(A.welle + 2, A.wellen.length) : T.welleIn(A.welle + 2, A.wellen.length, Math.ceil(A.vorT)), W / 2, 170, W - 60);
      if (erste) { x.font = "12px " + FONT_B; x.fillStyle = "#ebe2cc"; zeilenUmbruch(x, S.garten.setzlinge.length ? T.setzHinweis : T.abwehrIntro, W / 2, 194, W - 70, 14); }
      if (zn > 0) { x.font = "600 11px " + FONT_B; x.fillStyle = "#ffd34d"; x.fillText(T.zinsenText(zn), W / 2, 150 + h2 - 11, W - 56); }
    }
    if (A.demo && A.bossGerufen && !A.demoWeg) {
      x.textAlign = "center"; x.font = "700 13px " + FONT_B; x.fillStyle = "#9fd6ec"; x.fillText("🌊 " + Math.ceil(A.demoDauer - A.demoT) + " s", W / 2, 42);
    }
    // oben: Anzeigen
    leisteOben(x);
    let px = 8;
    px = hudText(x, "💰 " + Math.round(A.hort), px, A.hort < A.hortStart * 0.3 ? "#c4564a" : "#ffd34d") + 10;
    px = hudText(x, "🌱 " + Math.round(A.saat), px, "#cfe6a8") + 10;
    balken(x, px, 7, 76, 14, A.zorn / 100, A.zorn > 75 ? "#c4564a" : "#9b5a3a", T.hud.zorn); px += 86;
    px = hudText(x, "🌊 " + Math.max(1, A.welle + 1) + "/" + A.wellen.length + "  👣 " + (A.warte.length + A.feinde.filter(e => !e.d.unbesiegbar).length), px, "#a89f8f", 12) + 8;
    if (launeVon()) { x.save(); x.textAlign = "left"; x.textBaseline = "middle"; x.font = "13px " + FONT_B; x.fillText(LAUNEN[launeVon()].sym, px, 14); x.restore(); }
    // unten: Bauleiste
    leisteUnten(x);
    S.knoepfe = [];
    const p = A.wahl >= 0 ? A.plaetze[A.wahl] : null;
    x.textAlign = "left"; x.textBaseline = "middle";
    const BH = H - LEISTE - 6;
    if (p && !p.turm) {
      const G = S.garten, tab = A.bauTab;
      let auswahl = null;
      if (tab === "setz" && G.setzlinge.length) {
        const l = G.setzlinge.slice(0, 6), bw = Math.min(62, (W - 12) / l.length - 4);
        if (!(A.setzWahl < G.setzlinge.length)) A.setzWahl = 0;
        l.forEach((z, i) => knopfEinheit(x, "setz:" + i, 6 + i * (bw + 4), LEISTE + 3, bw, BH, z, T.frei, A.setzWahl === i, false, zeit));
        auswahl = { z: G.setzlinge[A.setzWahl], modus: "setz" };
      } else if (tab === "tiere") {
        const frei = TIERE_REIHE.filter(tierFrei), bw = Math.min(62, (W - 12) / frei.length - 4);
        if (!A.tierTyp || !tierFrei(A.tierTyp)) A.tierTyp = frei[0];
        frei.forEach((k, i) => { const voll = tierAnzahl(k) >= tierMax(), c = tierKosten(k, 0); knopfEinheit(x, "tier:" + k, 6 + i * (bw + 4), LEISTE + 3, bw, BH, { k, st: 0, tier: true }, voll ? T.maxTier : "🌱" + c, A.tierTyp === k, voll || A.saat < c, zeit); });
        auswahl = { z: { k: A.tierTyp, st: 0, tier: true }, modus: "bau" };
      } else {
        const frei = WACHTER_REIHE.filter(wachterFrei), bw = Math.min(62, (W - 12) / frei.length - 4);
        if (!A.bauTyp || !wachterFrei(A.bauTyp)) A.bauTyp = "dorn";
        frei.forEach((k, i) => knopfEinheit(x, "bau:" + k, 6 + i * (bw + 4), LEISTE + 3, bw, BH, { k, st: 0 }, "🌱" + kosten(k, 0), A.bauTyp === k, A.saat < kosten(k, 0), zeit));
        auswahl = { z: { k: A.bauTyp, st: 0 }, modus: "bau" };
      }
      if (auswahl && auswahl.z) einheitTafel(x, A, p, auswahl.z, auswahl.modus, zeit);
    } else if (p && p.turm) {
      const U = p.turm, lvl = U.st, max = U.tier ? 1 : TURM_MAX, rausB = 96, rx = W - rausB - 6;
      if (!U.tier && lvl === 1) {
        const c = kosten(U.k, 2), zt = T.zweige[U.k], bw = (rx - 12) / 2 - 3;
        ["a", "b"].forEach((zw2, i) => knopf(x, "zweig:" + zw2, 6 + i * (bw + 6), LEISTE + 4, bw, BH - 2, [zt[zw2][0], "🌱" + c], true, A.saat < c, A.saat < c ? "#c4564a" : "#cfe6a8"));
      } else if (lvl < max) {
        const c = U.tier ? tierKosten(U.k, lvl + 1) : kosten(U.k, lvl + 1);
        knopf(x, "staerker", 6, LEISTE + 4, rx - 12, BH - 2, [T.bau.verstaerken, "🌱" + c], true, A.saat < c, A.saat < c ? "#c4564a" : "#cfe6a8");
      } else knopf(x, "nix", 6, LEISTE + 4, rx - 12, BH - 2, [T.bau.max], false, true);
      const rg = rueckgabe(U);
      knopf(x, "raus", rx, LEISTE + 4, rausB, BH - 2, [T.bau.ausreissen, rg.beutel ? T.zurueckBeutel : "+" + rg.saat + " 🌱"], false, false, rg.beutel || (U.frisch && (A.vorT > 0 || A.halt)) ? "#cfe6a8" : undefined);
      einheitTafel(x, A, p, U, "steht", zeit);
    } else if (A.vorT > 0) {
      const bonus = Math.ceil(A.vorT) * 2;
      const plan = A.welle < 0 && S.garten.setzlinge.length > 0, jb = plan ? 150 : 220;
      knopf(x, "jetzt", 8, LEISTE + 6, jb, H - LEISTE - 12, [A.halt ? T.bereitLos : A.welle < 0 ? T.jetzt : T.rufen(bonus)], true, false, "#e0a046");
      if (plan) knopf(x, "zuletzt", 8 + jb + 6, LEISTE + 6, W - 86 - (8 + jb + 6) - 6, H - LEISTE - 12, [T.wieZuletzt, "🌱 " + S.garten.setzlinge.length], true, false, "#cfe6a8");
      knopf(x, "schnell", W - 86, LEISTE + 6, 78, H - LEISTE - 12, [T.schnell[(A.schnell || 1) - 1]], A.schnell > 1, false, "#ebe2cc");
    } else {
      A.zauber.forEach((z, i) => knopfZauber(x, "zauber:" + i, 6 + i * 92, LEISTE + 4, 88, H - LEISTE - 8, z, A.aktiv === i, zeit));
      x.textAlign = "center"; x.textBaseline = "middle"; x.font = "600 10px " + FONT_B; x.fillStyle = "#a89f8f";
      x.fillText(levelName(A.lv), 6 + A.zauber.length * 92 + (W - 92 - (6 + A.zauber.length * 92)) / 2, LEISTE + 26, W - 100 - A.zauber.length * 92);
      knopf(x, "schnell", W - 86, LEISTE + 6, 78, H - LEISTE - 12, [T.schnell[(A.schnell || 1) - 1]], A.schnell > 1, false, "#ebe2cc");
    }
  }
  function knopfZauber(x, id, bx, by, bw, bh, z, an, zeit) {
    S.knoepfe.push({ id, x: bx, y: by, w: bw, h: bh });
    const Z = ZAUBER[z.k], u = 1 - z.cd / z.max, bereit = z.cd <= 0;
    x.save();
    x.fillStyle = an ? "rgba(224,160,70,.22)" : "rgba(235,226,204,.07)";
    x.strokeStyle = an ? Z.farbe : "rgba(235,226,204,.22)"; x.lineWidth = an ? 2 : 1;
    x.beginPath(); x.roundRect ? x.roundRect(bx, by, bw, bh, 6) : x.rect(bx, by, bw, bh); x.fill();
    if (!bereit) { x.fillStyle = "rgba(0,0,0,.45)"; x.fillRect(bx + 1, by + 1, (bw - 2) * (1 - u), bh - 2); }
    x.stroke();
    if (bereit && an) { x.shadowColor = Z.farbe; x.shadowBlur = 8 + Math.sin(zeit * 6) * 4; }
    x.font = "18px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(Z.sym, bx + 18, by + bh / 2);
    x.shadowBlur = 0;
    x.textAlign = "left"; x.font = "700 11px " + FONT_B; x.fillStyle = bereit ? "#ebe2cc" : "#a89f8f";
    x.fillText(t().zauber[z.k][0], bx + 32, by + bh / 2 - 6, bw - 36);
    x.font = "600 10px " + FONT_B; x.fillStyle = bereit ? Z.farbe : "#a89f8f";
    x.fillText(bereit ? "✓" : Math.ceil(z.cd) + " s", bx + 32, by + bh / 2 + 8);
    x.restore();
  }
  function malEinheit(x, z, zeit) { if (z.tier) malTierFigur(x, z.k, z.st, null, zeit); else malTurm(x, z.k, z.st, null, zeit); }
  function knopfEinheit(x, id, bx, by, bw, bh, z, preisTxt, an, rot, zeit) {
    S.knoepfe.push({ id, x: bx, y: by, w: bw, h: bh });
    x.fillStyle = an ? "rgba(224,160,70,.26)" : "rgba(235,226,204,.07)";
    x.strokeStyle = an ? "#e0a046" : "rgba(235,226,204,.22)"; x.lineWidth = an ? 1.6 : 1;
    x.beginPath(); x.roundRect ? x.roundRect(bx, by, bw, bh, 6) : x.rect(bx, by, bw, bh); x.fill(); x.stroke();
    x.save(); x.beginPath(); x.rect(bx, by, bw, bh - 11); x.clip();
    x.translate(bx + bw / 2, by + bh - 19); x.scale(0.66, 0.66); if (rot) x.globalAlpha = 0.5;
    malEinheit(x, z, zeit); x.restore();
    if (z.st) { for (let i = 0; i <= z.st; i++) { x.fillStyle = "#e0a046"; kreis(x, bx + 6 + i * 5, by + 6, 1.8); } }
    x.font = "700 10px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = rot ? "#c4564a" : "#cfe6a8"; x.fillText(preisTxt, bx + bw / 2, by + bh - 6, bw - 4);
  }
  function turmWerte(k, st) {
    const w = WACHTER[k], f = 1 + 0.045 * Math.min(S.lv, KAMPAGNE + 10);
    return { schaden: Math.round(w.schaden[st] * f * mod("schaden", k)), schadenRoh: w.schaden[st] * mod("schaden", k), reich: w.reich[st], tempo: 1 / w.rate };
  }
  /* Werte-Tafel für Wächter, Tiere und Setzlinge. modus: bau | setz | steht */
  function einheitTafel(x, A, p, z, modus, zeit) {
    const T = t(), k = z.k, st = z.st || 0, istTier = !!z.tier, bauModus = modus !== "steht";
    const farbe = istTier ? TIERE[k].farbe : WACHTER[k].farbe;
    const [name, info] = istTier ? T.tiere[k] : T.wachter[k];
    // Textzeilen unter den Werten
    const zeilen = [];
    if (istTier) {
      zeilen.push(["✦ " + T.tierFaehig[k][st], "#cfe6a8"]);
      if (modus === "steht" && st === 0) zeilen.push(["▲ " + T.tierFaehig[k][1], "#a89f8f"]);
    } else {
      const w = WACHTER[k];
      if (st >= 2 && z.zweig) zeilen.push(["✦ " + T.zweige[k][z.zweig][0] + ": " + T.zweige[k][z.zweig][1], "#ffd34d"]);
      else zeilen.push(["✦ " + T.bau.spez[k](w, st), "#cfe6a8"]);
      if (modus === "steht" && st === 1) { zeilen.push([T.weg, "#a89f8f"]); ["a", "b"].forEach(zw2 => zeilen.push(["  " + T.zweige[k][zw2][0] + ": " + T.zweige[k][zw2][1], "#e8d8b8"])); }
      else if (T.bau.kombo[k]) zeilen.push(["⚡ " + T.bau.kombo[k], "#9fd6ec"]);
      if (modus === "steht" && st === 2) zeilen.push(["▲ " + T.uralt, "#ffd34d"]);
    }
    const tabs = modus !== "steht";
    const statsH = istTier ? (k === "baer" ? 14 : 0) : 42;
    const ph = Math.max(38 + statsH + zeilen.length * 14 + 8, tabs ? 84 : 60), pw = W - 12, px = 6;
    const py = p.y > LEISTE - ph - 50 ? 32 : LEISTE - ph - 4;
    // Vorschau am Bauplatz
    if (bauModus) {
      const r = istTier ? (TIERE[k].reich ? TIERE[k].reich[st] : 0) : WACHTER[k].reich[st] * mod("reich", k);
      x.save();
      if (r) { x.strokeStyle = "rgba(224,160,70,.65)"; x.fillStyle = "rgba(224,160,70,.07)"; x.setLineDash([5, 4]); x.lineWidth = 1.3; x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill(); x.stroke(); x.setLineDash([]); }
      x.translate(p.x, p.y); x.globalAlpha = 0.6; malEinheit(x, z, zeit); x.restore();
    }
    x.save();
    x.fillStyle = "rgba(18,14,11,.94)"; x.strokeStyle = farbe; x.lineWidth = 1.4;
    x.beginPath(); x.roundRect ? x.roundRect(px, py, pw, ph, 8) : x.rect(px, py, pw, ph); x.fill(); x.stroke();
    x.fillStyle = "rgba(235,226,204,.05)"; x.beginPath(); x.roundRect ? x.roundRect(px + 6, py + 6, 58, ph - 12, 6) : x.rect(px + 6, py + 6, 58, ph - 12); x.fill();
    x.save(); x.translate(px + 35, py + Math.min(ph / 2 + 12, 58)); x.scale(1.2, 1.2); malEinheit(x, z, zeit); x.restore();
    const tx = px + 72, rechts = bauModus ? 226 : pw - 80;
    x.textAlign = "left"; x.textBaseline = "middle";
    let reiterBreite = 0;
    if (tabs) {
      x.font = "700 10px " + FONT_B;
      const n = [T.tab.waechter].concat(TIERE_REIHE.some(tierFrei) ? [T.tab.tiere] : [], S.garten.setzlinge.length ? [T.tab.setz(S.garten.setzlinge.length)] : []);
      if (n.length > 1) reiterBreite = n.reduce((a, txt) => a + Math.max(40, x.measureText(txt).width + 12) + 4, 0);
    }
    const titel = name + (modus === "bau" ? "" : " · " + T.bau.stufeVon(st + 1).replace("/3", istTier ? "/2" : "/4"));
    x.font = "16px " + FONT_D; x.fillStyle = "#e0a046";
    const tb = tabs ? pw - 72 - reiterBreite - 10 : pw - 160;
    if (x.measureText(titel).width > tb) x.font = "13px " + FONT_D;
    x.fillText(titel, tx, py + 14, tb);
    x.font = "11px " + FONT_B; x.fillStyle = "#c8bfae"; x.fillText(info, tx, py + 30, rechts);
    let y = py + 46;
    if (!istTier) {
      const w = WACHTER[k], jetzt = turmWerte(k, st), dann = modus === "steht" && (st === 0 || st === 2) ? turmWerte(k, st + 1) : null;
      const rf = (z._reich || 1) * mod("reich", k), tf = (z._tempo || 1) * mod("rate", k);
      const zeile = (yy, label, wert, maxW, txt, wertDann, txtDann) => {
        x.font = "600 10px " + FONT_B; x.fillStyle = "#a89f8f"; x.textAlign = "left"; x.fillText(label, tx, yy);
        const bx = tx + 64, bw = 78;
        x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(bx, yy - 3.5, bw, 7);
        if (wertDann != null) { x.fillStyle = "rgba(207,230,168,.45)"; x.fillRect(bx, yy - 3.5, bw * klemm(wertDann / maxW, 0, 1), 7); }
        x.fillStyle = farbe; x.fillRect(bx, yy - 3.5, bw * klemm(wert / maxW, 0, 1), 7);
        x.font = "700 11px " + FONT_B; x.fillStyle = "#ebe2cc"; x.fillText(txt, bx + bw + 6, yy);
        if (txtDann) { const tw = x.measureText(txt).width; x.fillStyle = "#cfe6a8"; x.fillText(" → " + txtDann, bx + bw + 6 + tw, yy); }
      };
      const gift = w.typ === "gift", schadenTxt = v => gift ? T.bau.giftProSek(v) : String(v);
      zeile(y, T.bau.werte.schaden, jetzt.schadenRoh, 90, schadenTxt(jetzt.schaden), dann ? dann.schadenRoh : null, dann ? schadenTxt(dann.schaden) : null);
      zeile(y + 14, T.bau.werte.reich, jetzt.reich * rf, 125, String(Math.round(jetzt.reich * rf)) + (rf > 1 ? " 🦉" : ""), dann ? dann.reich * rf : null, dann ? String(Math.round(dann.reich * rf)) : null);
      zeile(y + 28, T.bau.werte.tempo, jetzt.tempo * tf, 1.7, T.bau.proSek((jetzt.tempo * tf).toFixed(1).replace(".", sprache() === "de" ? "," : ".")) + (tf > 1 ? " 🦌" : ""), null, null);
      y += 42;
    } else if (k === "baer" && modus === "steht") {
      const max = baerMaxHp(z), u = z.schlafT > 0 ? 0 : klemm((z.hp || max) / max, 0, 1);
      x.font = "600 10px " + FONT_B; x.fillStyle = "#a89f8f"; x.fillText("❤", tx, y);
      x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(tx + 14, y - 3.5, 120, 7); x.fillStyle = u > 0.35 ? "#8ac24a" : "#c4564a"; x.fillRect(tx + 14, y - 3.5, 120 * u, 7);
      x.font = "700 11px " + FONT_B; x.fillStyle = "#ebe2cc"; x.fillText(z.schlafT > 0 ? T.schlaeft : Math.round(z.hp || max) + " / " + Math.round(max), tx + 140, y);
      y += 14;
    } else if (k === "baer") y += 14;
    x.font = "italic 10.5px " + FONT_B;
    zeilen.forEach(([txt, f]) => { x.fillStyle = f; x.fillText(txt, tx, y + 2, rechts); y += 14; });
    x.restore();
    // Reiter und Zielwahl oben rechts
    if (tabs) {
      const G = S.garten, reiter = [["waechter", T.tab.waechter]];
      if (TIERE_REIHE.some(tierFrei)) reiter.push(["tiere", T.tab.tiere]);
      if (G.setzlinge.length) reiter.push(["setz", T.tab.setz(G.setzlinge.length)]);
      if (reiter.length > 1) {
        let rx = px + pw - 6;
        reiter.slice().reverse().forEach(([id, txt]) => {
          x.font = "700 10px " + FONT_B; const bw = Math.max(40, x.measureText(txt).width + 12); rx -= bw;
          const an = A.bauTab === id;
          S.knoepfe.push({ id: "tab:" + id, x: rx, y: py + 4, w: bw, h: 20 });
          x.fillStyle = an ? "rgba(224,160,70,.3)" : "rgba(235,226,204,.08)"; x.strokeStyle = an ? "#e0a046" : "rgba(235,226,204,.25)"; x.lineWidth = 1;
          x.beginPath(); x.roundRect ? x.roundRect(rx, py + 4, bw, 20, 10) : x.rect(rx, py + 4, bw, 20); x.fill(); x.stroke();
          x.fillStyle = an ? "#ffd34d" : "#ebe2cc"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, rx + bw / 2, py + 14.5);
          rx -= 4;
        });
      }
      const preis = modus === "setz" ? 0 : istTier ? tierKosten(k, 0) : kosten(k, 0);
      const voll = istTier && tierAnzahl(k) >= tierMax();
      knopf(x, "pflanzen", px + pw - 84, py + ph - 52, 78, 46, [T.bau.pflanzen, voll ? T.maxTier : preis ? "🌱" + preis : T.frei], true, voll || A.saat < preis, voll || A.saat < preis ? "#c4564a" : "#cfe6a8");
    } else if (!istTier) {
      const zm = T.zielmodus[z.ziel || "vorne"];
      x.font = "700 10px " + FONT_B; const bw = x.measureText(zm).width + 14, bx = px + pw - bw - 6;
      S.knoepfe.push({ id: "zielmodus", x: bx, y: py + 4, w: bw, h: 20 });
      x.fillStyle = "rgba(235,226,204,.1)"; x.strokeStyle = "rgba(235,226,204,.35)"; x.lineWidth = 1;
      x.beginPath(); x.roundRect ? x.roundRect(bx, py + 4, bw, 20, 10) : x.rect(bx, py + 4, bw, 20); x.fill(); x.stroke();
      x.fillStyle = "#ebe2cc"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(zm, bx + bw / 2, py + 14.5);
    }
    S.knoepfe.push({ id: "tafel", x: px, y: py, w: pw, h: ph });
  }
  function zeilenUmbruch(x, s, cx, cy, br, zh) {
    const woerter = s.split(" "), zeilen = []; let z = "";
    woerter.forEach(w => { const n = z ? z + " " + w : w; if (x.measureText(n).width > br && z) { zeilen.push(z); z = w; } else z = n; });
    if (z) zeilen.push(z);
    zeilen.forEach((l, i) => x.fillText(l, cx, cy + i * zh));
  }

  /* --- Titelbild --- */
  const TITEL_DINGE = [{ typ: "nugget", x: 120, y: 330, r: 19, seed: 0.3, dreh: 0 }, { typ: "edelstein", x: 270, y: 300, r: 8, seed: 0.1, dreh: 0 }, { typ: "truhe", x: 300, y: 390, r: 15, seed: 0.5, dreh: 0.2, inhalt: "gold" }, { typ: "muenze", x: 80, y: 410, r: 9, seed: 0.7, dreh: 0 }, { typ: "stein", x: 210, y: 250, r: 17, seed: 0.2, dreh: 0.3 }, { typ: "relikt", x: 190, y: 420, r: 15, seed: 0.9, dreh: 0 }, { typ: "beutel", x: 330, y: 220, r: 12, seed: 0.4, dreh: 0 }];
  function zeichneTitel(x, zeit) {
    const alt = S; if (!S) S = { lv: 0, up: {} };
    hintergrundRaub(gebietVon(S.lv || 0));
    x.drawImage(hgBild, 0, 0, W, H);
    TITEL_DINGE.forEach(d => malDing(x, d, zeit));
    malEcho(x, DREH.x, 62, 1.25, "ranke", 0, zeit);
    const w = Math.sin(zeit * 1.7) * 1.22;
    x.strokeStyle = "#4d6b35"; x.lineWidth = 3; x.beginPath(); x.moveTo(DREH.x, DREH.y); x.lineTo(DREH.x + Math.sin(w) * 24, DREH.y + Math.cos(w) * 24); x.stroke();
    S = alt;
  }

  function zeichnen(jetzt) {
    const zeit = jetzt / 1000;
    ctx.setTransform(skala, 0, 0, skala, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (S && S.beben > 0 && !ruhig) ctx.translate((Math.random() - 0.5) * 6 * S.beben, (Math.random() - 0.5) * 6 * S.beben);
    if (!S || zustand === "start" || (!S.R && !S.A)) { zeichneTitel(ctx, zeit); return; }
    if (S.phase === "raub" && S.R) zeichneRaub(ctx, zeit);
    else if (S.phase === "abwehr" && S.A) zeichneAbwehr(ctx, zeit);
    else zeichneTitel(ctx, zeit);
  }

  /* ---------- Schleife ---------- */
  let sichtbar = false, letzte = 0, rafId = 0, testTempo = 1;
  function effekteUpdate(dt) {
    S.teilchen.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; });
    S.teilchen = S.teilchen.filter(p => p.t < p.dauer);
    if (S.teilchen.length > 400) S.teilchen.splice(0, S.teilchen.length - 400);
    S.texte.forEach(tx => tx.t += dt); S.texte = S.texte.filter(tx => tx.t < tx.dauer);
    S.blitze.forEach(b => b.t += dt); S.blitze = S.blitze.filter(b => b.t < b.dauer);
    if (S.banner) { S.banner.t += dt; if (S.banner.t > S.banner.dauer) S.banner = null; }
    if (S.quip) { S.quip.t += dt; if (S.quip.t > 2) S.quip = null; }
    if (S.beben > 0) S.beben = Math.max(0, S.beben - dt);
  }
  let rahmenSchnitt = 16, langsamT = 0, lichtAus = false;
  function schleife(jetzt) {
    rafId = 0;
    const roh = letzte ? jetzt - letzte : 16;
    const dt = letzte ? Math.min(0.05, (jetzt - letzte) / 1000) : 0;
    /* Schwaches Gerät? Dann die Lichtebene abschalten, damit das Spiel flüssig bleibt */
    if (zustand === "spiel" && roh < 200) { rahmenSchnitt = rahmenSchnitt * 0.95 + roh * 0.05; if (rahmenSchnitt > 30) { langsamT += roh; if (langsamT > 3000) lichtAus = true; } else langsamT = 0; }
    letzte = jetzt;
    const schritte = testTempo * (S && S.phase === "abwehr" && S.A ? (S.A.schnell || 1) : 1);
    for (let i = 0; i < schritte && zustand === "spiel" && S; i++) {
      if (S.phase === "raub" && S.R) raubUpdate(dt);
      else if (S.phase === "abwehr" && S.A) abwehrUpdate(dt);
      effekteUpdate(dt);
    }
    zeichnen(jetzt);
    if (sichtbar && !document.hidden && (zustand === "spiel" || zustand === "start" || zustand === "tafel")) rafId = requestAnimationFrame(schleife);
  }
  function anwerfen() { if (!rafId && sichtbar && !document.hidden) { letzte = 0; rafId = requestAnimationFrame(schleife); } }

  /* ================== DOM, TAFELN & HAIN ================== */
  let buehne, schleier, tafel, fussRekord, tonKnopf, pauseKnopf, listeEl;
  let tafelArt = "start";
  const rekordKey = st => "imres-echohort-rekord-" + st;
  const aktuelleStufe = () => (S && zustand !== "start" ? S.stufe : stufeWahl);

  function aufbauen() {
    const tx = t();
    root.innerHTML =
      '<p class="label" id="eh-label">' + esc(tx.label) + '</p>' +
      '<h3 id="eh-titel">' + esc(tx.titel) + '</h3>' +
      '<p class="tav-info" id="eh-text">' + esc(tx.text) + '</p>' +
      '<p class="eh-steuerung" id="eh-steuerung">' + esc(tx.steuerung) + '</p>' +
      '<div class="eh-buehne"><button type="button" class="eh-pause" aria-label="Pause"><span aria-hidden="true">❚❚</span></button><div class="eh-schleier"><div class="eh-tafel"></div></div><div class="eh-toast" role="status" aria-live="polite"></div></div>' +
      '<div class="eh-fuss"><span class="eh-rekord"></span><button type="button" class="eh-ton"></button></div>' +
      '<div class="eh-liste" aria-live="polite"></div>';
    buehne = root.querySelector(".eh-buehne");
    buehne.insertBefore(leinwand, buehne.firstChild);
    leinwand.setAttribute("aria-label", tx.titel);
    schleier = root.querySelector(".eh-schleier");
    tafel = root.querySelector(".eh-tafel");
    fussRekord = root.querySelector(".eh-rekord");
    tonKnopf = root.querySelector(".eh-ton");
    pauseKnopf = root.querySelector(".eh-pause");
    listeEl = root.querySelector(".eh-liste");
    tonKnopf.addEventListener("click", () => { if (zustand === "spiel") pausieren(); einstZeigen(); });
    tafel.addEventListener("input", einstEingabe);
    tafel.addEventListener("change", einstEingabe);
    pauseKnopf.addEventListener("click", pausieren);
    tafel.addEventListener("click", tafelKlick);
    tafel.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest(".eh-name")) { e.preventDefault(); if (tafelArt === "tagErgebnis") tagEintragen(); else eintragen(); } });
    fussSetzen();
  }
  function fussSetzen() {
    const tx = t(), st = aktuelleStufe(), r = parseInt(lies(rekordKey(st), "0"), 10);
    fussRekord.textContent = r ? tx.rekord(r, tx.stufen[st]) : "";
    tonKnopf.textContent = tx.einst.knopf;
    pauseKnopf.setAttribute("aria-label", tx.pauseKnopf);
  }
  function texteSetzen() {
    const tx = t();
    root.querySelector("#eh-label").textContent = tx.label;
    root.querySelector("#eh-titel").textContent = tx.titel;
    root.querySelector("#eh-text").textContent = tx.text;
    root.querySelector("#eh-steuerung").textContent = tx.steuerung;
    leinwand.setAttribute("aria-label", tx.titel);
    fussSetzen(); listeNeu();
    if (zustand !== "spiel") tafelNeu();
  }
  function tafelNeu() {
    ({ start: startZeigen, druide: druideZeigen, einst: einstZeigen, schatz: schatzZeigen, levelwahl: levelwahlZeigen, intro: introZeigen, nachRaub: () => nachRaubZeigen(true), ergebnis: () => ergebnisZeigen(true), hain: hainZeigen, pause: pauseZeigen, ende: () => spielEnde(true), beute: kleinodZeigen, tag: () => tagZeigen(false), tagErgebnis: tagErgebnisZeigen })[tafelArt]();
  }
  function schleierAuf(html, art) {
    tafelArt = art; tafel.innerHTML = html; schleier.hidden = false; buehne.classList.remove("laeuft");
    schleier.scrollTop = 0;
  }
  function schleierZu() { schleier.hidden = true; buehne.classList.add("laeuft"); }
  function levelName(lv) {
    const T = t();
    return lv < KAMPAGNE ? T.levelKurz(T.gebiete[gebietVon(lv)][0], innenVon(lv) + 1) : T.levelEndlos(endlosRunde(lv));
  }
  function stufenHtml(tx) {
    return '<div class="eh-stufen" role="radiogroup" aria-label="' + esc(tx.stufenTitel) + '">' +
      Object.keys(STUFEN).map(k => '<button type="button" role="radio" data-stufe="' + k + '" aria-checked="' + (k === stufeWahl) + '">' + esc(tx.stufen[k]) + '</button>').join("") +
      '</div><p class="eh-stufen-text">' + esc(tx.stufenText[stufeWahl]) + '</p>';
  }

  function startZeigen() {
    const tx = t(), sp = gespeichert();
    zustand = "start";
    let fort = "";
    if (sp) {
      const nm = sp.lv < KAMPAGNE ? tx.fortsetzen(tx.gebiete[gebietVon(sp.lv)][0], innenVon(sp.lv) + 1) : tx.fortsetzenEndlos(endlosRunde(sp.lv));
      fort = '<button type="button" class="tav-knopf eh-haupt" data-tun="fortsetzen">' + esc(nm) + '</button>' +
        '<p class="eh-klein">' + esc(tx.stufen[sp.stufe]) + ' · ' + esc(tx.leben(sp.leben)) + ' · ' + sp.punkte + ' ' + esc(tx.punkte) + '</p>';
    }
    const frei = freiLesen(stufeWahl), sterne = sterneLesen(stufeWahl), summe = Object.keys(sterne).reduce((a, k) => a + (sterne[k] || 0), 0);
    const lw = frei > 0 || summe > 0 ? '<button type="button" class="tav-knopf" data-tun="levelwahl">' + esc(tx.levelwahl) + ' <small>' + esc(tx.sterneGesamt(summe, KAMPAGNE * 3)) + '</small></button>' : "";
    schleierAuf('<h4>' + esc(tx.titel) + '</h4>' + fort + stufenHtml(tx) +
      '<button type="button" class="tav-knopf ' + (sp ? "" : "eh-haupt") + '" data-tun="neu">' + esc(tx.neu) + '</button>' + lw +
      '<button type="button" class="tav-knopf" data-tun="tag">' + esc(tx.tag.knopf) + ' <small>' + LAUNEN[tagInfo(heuteDatum()).laune].sym + '</small></button>' +
      '<button type="button" class="tav-knopf" data-tun="druide">' + esc(tx.druide.knopf) + ' <small>' + (STAT.mond || 0) + '</small></button>' +
      '<button type="button" class="tav-knopf" data-tun="schatz">' + esc(tx.schatzkammer) + '</button>' +
      (sp ? '<p class="eh-klein">' + esc(tx.neuWarnung) + '</p>' : ""), "start");
  }

  const reliktBilder = {};
  function reliktBild(g) {
    if (reliktBilder[g]) return reliktBilder[g];
    const c = document.createElement("canvas"); c.width = 96; c.height = 96;
    const x = c.getContext("2d"); x.scale(3, 3); x.translate(16, 17);
    const alt = S; if (!S) S = { lv: 0, up: {} };
    malRelikt(x, GEB[g].relikt, 11, 0, 0.5);
    S = alt;
    return (reliktBilder[g] = c.toDataURL());
  }
  function druideZeigen() {
    const tx = t(), D = tx.druide, mond = STAT.mond || 0;
    const zeilen = Object.keys(TALENTE).map(k => {
      const Tl = TALENTE[k], st = tal(k), voll = st >= Tl.kosten.length, preis = voll ? 0 : Tl.kosten[st], kann = !voll && mond >= preis;
      const [name, text] = tx.talente[k];
      return '<div class="eh-up eh-talent' + (voll ? " voll" : "") + '"><span class="sym" aria-hidden="true">' + Tl.sym + '</span>' +
        '<span class="eh-up-text"><strong>' + esc(name) + '</strong><small>' + esc(text) + '</small><span class="eh-pips">' + Tl.kosten.map((_, i) => '<i class="' + (i < st ? "an" : "") + '"></i>').join("") + '</span></span>' +
        '<button type="button" class="eh-kauf" data-talent="' + k + '"' + (kann ? "" : " disabled") + '>' + esc(voll ? D.voll : preis + " 🌙") + '</button></div>';
    }).join("");
    schleierAuf('<h4>' + esc(D.titel) + '</h4><p>' + esc(D.text) + '</p><p class="eh-beutel">' + esc(D.steine(mond)) + '</p>' +
      '<div class="eh-hain">' + zeilen + '</div>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="zumStart">' + esc(tx.zurueck) + '</button>', "druide");
  }
  function talentLernen(k) {
    const Tl = TALENTE[k], st = tal(k); if (!Tl || st >= Tl.kosten.length) return;
    const preis = Tl.kosten[st]; if ((STAT.mond || 0) < preis) return;
    STAT.mond -= preis; STAT.talente[k] = st + 1; statSichern(); KLANG.edel();
    const sc = schleier.scrollTop; druideZeigen(); schleier.scrollTop = sc;
  }
  let schatzZurueck = "start";
  function schatzZeigen() {
    const tx = t();
    if (tafelArt !== "schatz") schatzZurueck = tafelArt;
    const karten = GEB.map((G, g) => {
      const n = STAT.relikte[g] || 0;
      return '<div class="eh-relikt' + (n ? "" : " fehlt") + '">' + (n ? '<img src="' + reliktBild(g) + '" alt="">' : '<span class="frage">?</span>') +
        '<strong>' + esc(n ? tx.relikt[g] : tx.unbekannt) + '</strong><small>' + esc(tx.gebiete[g][0]) + (n ? " · " + tx.reliktAnzahl(n) : "") + '</small></div>';
    }).join("");
    const troph = ERFOLGE.map(([id, sym]) => {
      const hat = STAT.erfolge[id];
      return '<div class="eh-troph' + (hat ? " hat" : "") + '"><span class="sym" aria-hidden="true">' + (hat ? sym : "🔒") + '</span><span><strong>' + esc(tx.erfolge[id][0]) + '</strong><small>' + esc(tx.erfolge[id][1]) + '</small></span></div>';
    }).join("");
    const anzahl = ERFOLGE.filter(([id]) => STAT.erfolge[id]).length;
    schleierAuf('<h4>' + esc(tx.schatzTitel) + '</h4><p>' + esc(tx.schatzText) + '</p>' +
      '<div class="eh-relikte">' + karten + '</div>' +
      '<h5>' + esc(tx.trophaeen) + ' · ' + anzahl + '/' + ERFOLGE.length + '</h5><div class="eh-trophs">' + troph + '</div>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="schatzZurueck">' + esc(tx.zurueck) + '</button>', "schatz");
  }

  function levelwahlZeigen() {
    const tx = t(), st = S && S.einzel ? S.stufe : stufeWahl, frei = freiLesen(st), sterne = sterneLesen(st);
    zustand = "start"; S = null; hgSchluessel = ""; musikStop();
    const summe = Object.keys(sterne).reduce((a, k) => a + (sterne[k] || 0), 0);
    const zeilen = GEB.map((G, g) => '<div class="eh-lw-zeile"><span class="eh-lw-name">' + esc(tx.gebiete[g][0]) + '</span>' +
      [0, 1, 2].map(i => {
        const lv = g * LEVEL_PRO_GEBIET + i, offen = lv <= frei, n = sterne[lv] || 0;
        return '<button type="button" class="eh-lw" data-level="' + lv + '"' + (offen ? "" : " disabled") + '><b>' + (i + 1) + (i === 2 ? " ☠" : "") + '</b><small>' + (offen ? "★".repeat(n) + "☆".repeat(3 - n) : "🔒") + '</small></button>';
      }).join("") + '</div>').join("");
    schleierAuf('<h4>' + esc(tx.levelwahlTitel) + '</h4><p>' + esc(tx.levelwahlText) + '</p>' +
      '<p class="eh-beutel">' + esc(tx.sterneGesamt(summe, KAMPAGNE * 3)) + ' · ' + esc(tx.stufen[st]) + '</p>' +
      '<div class="eh-lw-gitter">' + zeilen + '</div>' +
      '<button type="button" class="eh-leise" data-tun="zumStart">' + esc(tx.zurueck) + '</button>', "levelwahl");
    zeichnen(performance.now());
  }
  function einzelStarten(lv) {
    const st = stufeWahl;
    stufeWahl = st; neuesSpiel();
    S.einzel = true; S.lv = lv; S.leben = 1; S.up = Object.assign({}, hainBestLesen(st));
    const gb = jsonLies("imres-echohort-gartenbest-" + st, null);
    if (gb && gb.turme) S.garten = { g: -1, turme: {}, setzlinge: Object.keys(gb.turme).map(i => gb.turme[i]).concat(gb.setzlinge || []) };
    /* Für „Level wiederholen“: jeder Versuch beginnt mit genau diesem Garten – sonst ließe er sich mit der vollen Start-Saat beliebig aufstocken */
    S.gartenStart = S.garten ? JSON.stringify(gartenDaten()) : null;
    introZeigen();
  }

  function launeHtml() {
    const tx = t(), k = launeVon(); if (!k) return "";
    const [name, plus, minus] = tx.launen[k];
    return '<p class="eh-laune"><b>' + LAUNEN[k].sym + " " + esc(tx.launeTitel) + ": " + esc(name) + '</b><span class="plus">＋ ' + esc(plus) + '</span><span class="minus">− ' + esc(minus) + '</span></p>';
  }
  function kleinodBesitzHtml() {
    const tx = t(), l = (S && S.kleinode) || []; if (!l.length) return "";
    return '<div class="eh-besitz"><span class="eh-ober">' + esc(tx.kleinodeLabel) + '</span>' + l.map(k => '<span class="eh-kl" title="' + esc(tx.kleinod[k][1]) + '">' + KLEINODE[k].sym + " " + esc(tx.kleinod[k][0]) + '</span>').join("") + '</div>';
  }
  function introZeigen() {
    const tx = t(), lv = S.lv, g = gebietVon(lv);
    zustand = "tafel";
    if (!S.laune || S.laune.lv !== lv) S.laune = { lv, k: lv >= 2 ? zufall(launenFuer(lv)) : null };
    S.R = null; S.A = null;
    hintergrundRaub(g); hgSchluessel = "raub" + g;
    const neu = neueFreischaltungen(lv);
    const [name, text] = lv < KAMPAGNE ? tx.gebiete[g] : [tx.endlosName, tx.endlosText(endlosRunde(lv))];
    const unter = lv < KAMPAGNE ? tx.levelKurz(tx.gebiete[g][0], innenVon(lv) + 1).split(" · ")[1] : tx.levelEndlos(endlosRunde(lv));
    schleierAuf(
      '<p class="eh-ober">' + esc(unter) + (istBossLevel(lv) ? ' · ☠' : '') + '</p>' +
      '<h4>' + esc(name) + '</h4>' +
      '<p class="eh-erzaehl">' + esc(text) + '</p>' +
      (innenVon(lv) === 0 ? '<p class="eh-klein">🌿 ' + esc(tx.gartenHinweis) + '</p>' : "") +
      '<p class="eh-regel"><b>' + esc(tx.besonderheit) + ' ' + esc(tx.regeln[GEB[g].regel][0]) + '.</b> ' + esc(tx.regeln[GEB[g].regel][1]) + '</p>' +
      (neu.length ? '<p class="eh-neu">' + esc(tx.neuFreigeschaltet) + ' ' + neu.map(esc).join(" · ") + '</p>' : "") +
      launeHtml() + kleinodBesitzHtml() +
      (lv === 0 ? '<p>' + esc(tx.raubIntro) + '</p>' : "") +
      (S.einzel ? '<p class="eh-klein">' + esc(tx.einzelLabel) + ' · ' + "★".repeat(sterneLesen(S.stufe)[lv] || 0) + "☆".repeat(3 - (sterneLesen(S.stufe)[lv] || 0)) + '</p>'
        : '<p class="eh-klein">' + esc(tx.leben(S.leben)) + ' · ' + S.punkte + ' ' + esc(tx.punkte) + ' · ' + esc(tx.beutel(S.beutel)) + '</p>') +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="raub">' + esc(tx.los) + '</button>' +
      (S.einzel ? '<button type="button" class="eh-leise" data-tun="levelwahl">' + esc(tx.zurueck) + '</button>' : ""), "intro");
    zeichnen(performance.now());
  }

  function nachRaubZeigen(nurNeu) {
    const tx = t(), R = S.R;
    zustand = "tafel";
    const extra = Math.round(R.gier * 2);
    if (!R.gl) R.gl = gegnerListe(S.lv, R.gier);
    schleierAuf(
      '<p class="eh-ober">' + esc(levelName(S.lv)) + '</p>' +
      '<h4>' + esc(tx.raubFertig) + '</h4>' +
      '<dl class="eh-werte">' +
      '<dt>' + esc(tx.raubWerte.beute) + '</dt><dd>💰 ' + R.beute + '</dd>' +
      '<dt>' + esc(tx.raubWerte.gier) + '</dt><dd>×' + (1 + 0.15 * R.gier).toFixed(2) + '</dd>' +
      '<dt>' + esc(tx.raubWerte.saat) + '</dt><dd>🌱 ' + Math.round(R.saat) + '</dd>' +
      '<dt>' + esc(tx.raubWerte.schaetze) + '</dt><dd>' + R.schaetze + '</dd>' +
      '</dl>' +
      '<p class="eh-warn">' + esc(tx.gierWarnung(extra)) + '</p>' +
      launeHtml() + vorschauHtml(R.gl) + zauberWahlHtml() +
      (S.lv <= 1 ? '<p>' + esc(tx.raubHinweis) + '</p>' : "") +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="abwehr">' + esc(tx.zurAbwehr) + '</button>', "nachRaub");
    if (!nurNeu) KLANG.gold();
  }

  function zauberWahlHtml() {
    const tx = t(), frei = zauberFrei(), wahl = zauberWahlPruefen();
    if (frei.length < 2) return "";
    return '<div class="eh-zauberwahl"><p class="eh-ober">' + esc(frei.length > 2 ? tx.zauberWahl : tx.hud.feuerball) + '</p><div class="eh-zw-liste">' +
      frei.map(k => '<button type="button" class="eh-zw" data-zauber="' + k + '" aria-pressed="' + wahl.includes(k) + '"' + (frei.length <= 2 ? " disabled" : "") + '><span class="sym" aria-hidden="true">' + ZAUBER[k].sym + '</span><span><strong>' + esc(tx.zauber[k][0]) + '</strong><small>' + esc(tx.zauber[k][1]) + '</small></span></button>').join("") +
      '</div></div>';
  }
  function zauberUmschalten(k) {
    const w = zauberWahlPruefen().slice();
    if (w.includes(k)) { if (w.length > 1) w.splice(w.indexOf(k), 1); }
    else { if (w.length >= 2) w.shift(); w.push(k); }
    S.zauber = w; KLANG.griff();
    const sc = schleier.scrollTop; nachRaubZeigen(true); schleier.scrollTop = sc;
  }
  function eigenschaften(k) {
    const d = FEINDE[k], l = [];
    if (d.unbesiegbar) return ["unbesiegbar"];
    if (d.flug) l.push("flug");
    if (d.v >= 48) l.push("schnell");
    if (d.hp >= 150 && !d.boss) l.push("zaeh");
    ["ausweichen", "unsichtbar", "netz", "feuerSchwach", "wurzelFest", "ruft", "blinzeln", "gift", "schrei", "wurf", "verwandeln"].forEach(f => { if (d[f]) l.push(f); });
    return l;
  }
  function vorschauHtml(gl) {
    const tx = t(), zaehl = new Map();
    gl.liste.forEach(k => zaehl.set(k, (zaehl.get(k) || 0) + 1));
    if (gl.demo) zaehl.set("demogorgon", 1);
    const zeilen = [...zaehl].sort((a, b) => (FEINDE[a[0]].boss ? 1 : 0) - (FEINDE[b[0]].boss ? 1 : 0)).map(([k, n]) => {
      const d = FEINDE[k];
      return '<div class="eh-vz' + (d.boss ? " boss" : "") + '"><span class="eh-vz-n">' + (d.boss ? "☠" : n + "×") + '</span><span class="eh-vz-name">' + esc(tx.feinde[k]) + '</span>' +
        '<span class="eh-vz-eig">' + eigenschaften(k).map(e => esc(tx.eig[e])).join(" · ") + '</span></div>';
    }).join("");
    return '<div class="eh-vorschau"><p class="eh-ober">' + esc(tx.vorschau) + '</p>' + zeilen + '</div>';
  }

  function ergebnisZeigen(nurNeu) {
    const tx = t();
    if (!nurNeu) {
      const A = S.A, R = S.R;
      zustand = "tafel";
      gartenSync();
      if (S.tag) {
        const pkt = A.verloren ? A.punkte : Math.round(Math.max(0, A.hort - A.reserve) * (1 + 0.15 * R.gier)) + A.punkte;
        S.erg = { tag: true, verloren: !!A.verloren, pkt, erlegt: A.erlegt };
        if (A.verloren) KLANG.verloren();
        const best = jsonLies("imres-echohort-tagbest", {});
        if (best.datum !== S.tag || pkt > (best.punkte || 0)) schreib("imres-echohort-tagbest", JSON.stringify({ datum: S.tag, punkte: pkt }));
        S.eingetragen = ""; S.sendet = false; S.fehler = ""; S.endgueltig = false; S.lokal = null; S.nameEingabe = null;
        tagErgebnisZeigen(); tagListeLaden(S.tag);
        return;
      }
      if (A.verloren) {
        S.erg = { verloren: true };
        KLANG.verloren();
        if (!S.einzel) {
          S.leben--;
          if (S.leben <= 0) { speicherLoeschen(); spielEnde(); return; }
          speichern();
        }
      } else {
        const gesichert = Math.max(0, Math.round(A.hort - A.reserve));
        const faktor = 1 + 0.15 * R.gier;
        const pkt = Math.round(gesichert * faktor) + A.punkte;
        const insBeutel = Math.round(gesichert * 0.5);
        const ziele = [true, A.verlorenGold === 0, R.gier >= 3];
        const sterne = ziele.filter(Boolean).length;
        let neuBest = false, neueSterne = 0;
        if (S.lv < KAMPAGNE) {
          const alle = sterneLesen(S.stufe);
          if (sterne > (alle[S.lv] || 0)) { neueSterne = sterne - (alle[S.lv] || 0); alle[S.lv] = sterne; neuBest = true; schreib("imres-echohort-sterne-" + S.stufe, JSON.stringify(alle)); }
        }
        erfolgPruefen("sterne");
        if (A.demo && A.verlorenGold === 0 && A.hort >= A.hortStart) erfolg("demo");
        if (S.lv >= 3 && A.plaetze.filter(p => p.turm).length <= 2) erfolg("sparsam");
        if (!S.einzel && S.lv === KAMPAGNE - 1) erfolg("kampagne");
        if (!S.einzel && S.lv >= KAMPAGNE + 4) erfolg("endlos5");
        statSichern();
        const mond = (S.einzel ? 0 : 1 + (istBossLevel(S.lv) ? 2 : 0)) + neueSterne;
        STAT.mond = (STAT.mond || 0) + mond; statSichern();
        S.erg = { verloren: false, gesichert, insBeutel, faktor, erlegt: A.erlegt, pkt, mond, sieg: S.lv === KAMPAGNE - 1 && !S.einzel, ziele, sterne, neuBest, zurueck: A.zurueckGold, verlorenGold: A.verlorenGold, zins: A.zinsGesamt || 0, erspart: 0 };
        if (!S.einzel) {
          S.erspart = ersparnis(A.saat); S.erg.erspart = S.erspart;
          if (istBossLevel(S.lv)) { const frei = KLEINODE_REIHE.filter(k => !(S.kleinode || []).includes(k)); if (frei.length) S.angebot = mischen(frei.slice()).slice(0, 3); }
          S.punkte += pkt; S.beutel += insBeutel; S.goldGesamt += gesichert;
          S.lv++;
          speichern();
        } else {
          const fr = parseInt(lies("imres-echohort-frei-" + S.stufe, "0"), 10) || 0;
          if (S.lv + 1 > fr && S.lv + 1 < KAMPAGNE) schreib("imres-echohort-frei-" + S.stufe, String(S.lv + 1));
        }
      }
    }
    const E = S.erg;
    if (E.tag) { tagErgebnisZeigen(); return; }
    if (E.verloren && S.einzel) {
      schleierAuf('<p class="eh-ober">' + esc(tx.einzelLabel) + '</p><h4>' + esc(tx.verloren) + '</h4>' +
        '<button type="button" class="tav-knopf eh-haupt" data-tun="wiederholen">' + esc(tx.nochmalLevel) + '</button>' +
        '<button type="button" class="tav-knopf" data-tun="levelwahl">' + esc(tx.zurLevelwahl) + '</button>', "ergebnis");
      return;
    }
    if (E.verloren) {
      schleierAuf('<h4>' + esc(tx.verloren) + '</h4><p>' + esc(tx.verlorenText(S.leben)) + '</p>' +
        '<button type="button" class="tav-knopf eh-haupt" data-tun="wiederholen">' + esc(tx.nochmalLevel) + '</button>' +
        '<button type="button" class="eh-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>', "ergebnis");
      return;
    }
    const sternHtml = '<p class="eh-sterne" aria-label="' + E.sterne + ' / 3">' + [0, 1, 2].map(i => '<span class="' + (i < E.sterne ? "an" : "") + '">★</span>').join("") + '</p>' +
      '<ul class="eh-ziele">' + ["sieg", "alles", "gier"].map((k, i) => '<li class="' + (E.ziele[i] ? "ja" : "") + '">' + (E.ziele[i] ? "✓ " : "✗ ") + esc(tx.sterne[k]) + '</li>').join("") + '</ul>';
    if (S.einzel) {
      schleierAuf('<p class="eh-ober">' + esc(tx.einzelLabel) + ' · ' + esc(levelName(S.lv)) + '</p>' +
        '<h4>' + esc(tx.sicher) + '</h4>' + sternHtml +
        (E.neuBest ? '<p class="eh-neu">' + esc(tx.neuRekord) + '</p>' : "") +
        (E.mond ? '<p class="eh-mond">' + esc(tx.druide.verdient(E.mond)) + '</p>' : "") +
        '<button type="button" class="tav-knopf eh-haupt" data-tun="levelwahl">' + esc(tx.zurLevelwahl) + '</button>' +
        '<button type="button" class="tav-knopf" data-tun="wiederholen">' + esc(tx.nochmalLevel) + '</button>', "ergebnis");
      return;
    }
    schleierAuf(
      '<h4>' + esc(E.sieg ? tx.sieg : tx.sicher) + '</h4>' +
      (E.sieg ? '<p class="eh-erzaehl">' + esc(tx.siegText) + '</p>' : "") +
      sternHtml +
      '<dl class="eh-werte">' +
      '<dt>' + esc(tx.ergWerte.gesichert) + '</dt><dd>💰 ' + E.gesichert + '</dd>' +
      '<dt>' + esc(tx.ergWerte.gier) + '</dt><dd>×' + E.faktor.toFixed(2) + '</dd>' +
      '<dt>' + esc(tx.ergWerte.erlegt) + '</dt><dd>' + E.erlegt + '</dd>' +
      '<dt>' + esc(tx.ergWerte.punkte) + '</dt><dd>+' + E.pkt + '</dd>' +
      '<dt>' + esc(tx.ergWerte.beutel) + '</dt><dd>💰 +' + E.insBeutel + '</dd>' +
      (E.mond ? '<dt>' + esc(tx.druide.titel) + '</dt><dd>' + esc(tx.druide.verdient(E.mond)) + '</dd>' : "") +
      (E.zins ? '<dt>🐿 ' + esc(tx.zinsen(E.zins).replace(/^\+\d+ 🌱 /, "")) + '</dt><dd>🌱 +' + E.zins + '</dd>' : "") +
      '</dl>' +
      (E.erspart ? '<p class="eh-neu">' + esc(tx.erspart(E.erspart)) + '</p>' : "") +
      '<p class="eh-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + '</span></p>' +
      (S.angebot ? '<button type="button" class="tav-knopf eh-haupt" data-tun="beute">' + esc(tx.kleinodKnopf) + '</button>'
        : '<button type="button" class="tav-knopf eh-haupt" data-tun="hain">' + esc(tx.zumHain) + '</button>'), "ergebnis");
  }

  function kleinodZeigen() {
    const tx = t(); zustand = "tafel";
    if (!S.angebot || !S.angebot.length) { hainZeigen(); return; }
    const karten = S.angebot.map(k => '<button type="button" class="eh-zw eh-kleinod" data-kleinod="' + k + '"><span class="sym" aria-hidden="true">' + KLEINODE[k].sym + '</span><span><strong>' + esc(tx.kleinod[k][0]) + '</strong><small>' + esc(tx.kleinod[k][1]) + '</small></span></button>').join("");
    schleierAuf('<p class="eh-ober">☠ ' + esc(levelName(S.lv - 1)) + '</p><h4>' + esc(tx.kleinodTitel) + '</h4><p>' + esc(tx.kleinodText) + '</p>' +
      '<div class="eh-zw-liste eh-kleinode">' + karten + '</div>' + kleinodBesitzHtml(), "beute");
  }
  function kleinodWaehlen(k) {
    if (!S || !S.angebot || !S.angebot.includes(k)) return;
    S.kleinode = (S.kleinode || []).concat([k]); S.angebot = null;
    KLANG.edel(); vib(40); speichern(); hainZeigen();
  }

  /* ---------- Tagesherausforderung: für alle gleich, jeden Tag neu ---------- */
  function heuteDatum() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function tagSaat(datum) { let h = 2166136261; for (let i = 0; i < datum.length; i++) { h ^= datum.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483645 + 1; }
  function tagInfo(datum) {
    const rng = lcg(tagSaat(datum)); rng(); rng();
    /* Bis heute galt die Kampagne mit 24 Leveln – so bleibt die Aufgabe eines Tages für alle gleich */
    const lv = 6 + Math.floor(rng() * ((datum < "2026-10-27" ? 24 : KAMPAGNE) - 6));
    const ln = launenFuer(lv), laune = ln[Math.floor(rng() * ln.length)];
    const ko = KLEINODE_REIHE.slice(), kl = [];
    for (let i = 0; i < 2; i++) kl.push(ko.splice(Math.floor(rng() * ko.length), 1)[0]);
    return { lv, laune, kleinode: kl };
  }
  function tagSpielBauen() {
    const datum = heuteDatum(), I = tagInfo(datum);
    neuesSpiel();
    Object.assign(S, { stufe: "druide", leben: 1, einzel: true, tag: datum, up: {}, lv: I.lv, laune: { lv: I.lv, k: I.laune }, kleinode: I.kleinode, zauber: null });
    const alt = Math.random; Math.random = lcg(tagSaat(datum) + 13);
    let gl; try { gl = gegnerListe(I.lv, 2); } finally { Math.random = alt; }
    S.tagR = { g: gebietVon(I.lv), beute: 300 + 20 * I.lv, gier: 2, saat: 0, schaetze: 0, gl, dinge: [] };
  }
  const tagListe = {};
  function tagListeLaden(datum) {
    const st = "tag-" + datum;
    return server("/rest/v1/hort_bestenliste?select=name,punkte,level,erstellt&stufe=eq." + st + "&order=punkte.desc,erstellt.asc&limit=10")
      .then(l => { tagListe[datum] = { l: Array.isArray(l) ? l : [], ok: true }; })
      .catch(() => { tagListe[datum] = { l: sortieren(lokalLesen()[st] || []).slice(0, 10), ok: false }; })
      .then(() => { const el = tafel.querySelector(".eh-tagliste"); if (el) el.innerHTML = tagListeHtml(datum); });
  }
  function tagListeHtml(datum) {
    const T = t(), L = tagListe[datum];
    if (!L) return "";
    return '<p class="eh-ober">' + esc(T.tag.liste) + '</p>' + (L.l.length ? "<table><tbody>" +
      L.l.map((e, i) => "<tr" + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.punkte + "</td></tr>").join("") +
      "</tbody></table>" : '<p class="eh-klein">' + esc(T.tag.leer) + "</p>") + (L.ok ? "" : '<p class="eh-klein">' + esc(T.nurHier) + "</p>");
  }
  function tagZeigen(neu) {
    const tx = t(), T = tx.tag;
    if (neu || !S || !S.tag || S.tag !== heuteDatum() || S.A) tagSpielBauen();
    zustand = "tafel"; tafelArt = "tag"; hgSchluessel = "";
    const lv = S.lv, g = gebietVon(lv), best = jsonLies("imres-echohort-tagbest", {});
    const kl = S.kleinode.map(k => '<span class="eh-kl">' + KLEINODE[k].sym + " <b>" + esc(tx.kleinod[k][0]) + "</b> – " + esc(tx.kleinod[k][1]) + '</span>').join("");
    schleierAuf('<p class="eh-ober">' + esc(T.heute(S.tag)) + '</p><h4>' + esc(T.titel) + '</h4><p>' + esc(T.text) + '</p>' +
      '<p class="eh-regel"><b>' + esc(levelName(lv)) + '</b>' + (istBossLevel(lv) ? " · ☠" : "") + '</p>' +
      launeHtml() + '<div class="eh-besitz eh-tagkl"><span class="eh-ober">' + esc(T.dabei) + '</span>' + kl + '</div>' +
      vorschauHtml(S.tagR.gl) +
      (best.datum === S.tag ? '<p class="eh-neu">' + esc(T.best(best.punkte)) + '</p>' : "") +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="tagStart">' + esc(T.start) + '</button>' +
      '<div class="eh-tagliste">' + tagListeHtml(S.tag) + '</div>' +
      '<button type="button" class="eh-leise" data-tun="zumStart">' + esc(T.zumStart) + '</button>', "tag");
    tagListeLaden(S.tag);
    zeichnen(performance.now());
  }
  function tagStarten() {
    if (!S || !S.tagR) tagSpielBauen();
    S.R = S.tagR; S.phase = "abwehr"; S.texte = []; S.teilchen = []; S.blitze = [];
    abwehrStarten(); losSpielen();
  }
  function tagErgebnisZeigen() {
    const tx = t(), T = tx.tag, E = S.erg, best = jsonLies("imres-echohort-tagbest", {});
    const name = lies("imres-echohort-name", "") || lies("imres-diebesnacht-name", "") || lies("imres-waldlauf-name", "") || lies("imres-auftritt-name", "");
    const eintrag = E.pkt <= 0 ? "" : S.eingetragen ? '<p class="eh-eingetragen">' + esc(S.eingetragen) + "</p>" :
      eintragFeld(tx, name, '<button type="button" class="tav-knopf" data-tun="tagEintragen">');
    schleierAuf('<p class="eh-ober">' + esc(T.titel) + ' · ' + esc(S.tag) + '</p><h4>' + esc(E.verloren ? tx.verloren : T.geschafft) + '</h4>' +
      (E.verloren ? '<p>' + esc(T.verloren) + '</p>' : "") +
      '<p class="eh-gross">' + E.pkt + ' <span>' + esc(T.punkte) + '</span></p>' +
      (best.datum === S.tag ? '<p class="eh-klein">' + esc(T.best(best.punkte)) + '</p>' : "") +
      eintrag + '<div class="eh-tagliste">' + tagListeHtml(S.tag) + '</div>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="tagNochmal">' + esc(T.nochmal) + '</button>' +
      '<button type="button" class="eh-leise" data-tun="zumStart">' + esc(T.zumStart) + '</button>', "tagErgebnis");
  }
  function tagEintragen() {
    if (!S || !S.tag || !S.erg || S.eingetragen || S.sendet || S.endgueltig) return;
    const feld = tafel.querySelector(".eh-name"), name = ImresKuerzel.wert(feld);
    if (!name) { if (feld) feld.focus(); return; }
    schreib("imres-echohort-name", name);
    const T = t(), datum = S.tag, st = "tag-" + datum, spiel = S;
    const e = { name, punkte: S.erg.pkt, level: S.lv + 1, erstellt: new Date().toISOString() };
    const lok = lokalLesen(), alt = spiel.lokal; lok[st] = sortieren((lok[st] || []).filter(x => !alt || x.erstellt !== alt).concat([e])).slice(0, 10);
    schreib("imres-echohort-liste", JSON.stringify(lok));
    spiel.lokal = e.erstellt; spiel.nameEingabe = name;
    senden(spiel, T, { p_name: name, p_stufe: st, p_punkte: e.punkte, p_level: e.level }, () => tagListeLaden(datum), () => {
      const l = (tagListe[datum] || { l: [] }).l, i = l.findIndex(x => x.name === name && x.punkte === e.punkte);
      return { i, e: l[i] };
    }, tagErgebnisZeigen, () => tafelArt === "tagErgebnis");
  }

  function hainZeigen() {
    const tx = t();
    zustand = "tafel";
    const gruppen = ["raub", "wesen", "abwehr", "besonders"].map(gr => {
      const zeilen = Object.keys(UPS).filter(k => UPS[k].gruppe === gr).map(k => {
        const u = UPS[k], st = S.up[k] || 0, voll = st >= u.kosten.length || (k === "heilkraut" && S.leben >= MAX_LEBEN);
        const preis = voll ? 0 : u.kosten[st], kann = !voll && S.beutel >= preis;
        const [name, text] = tx.up[k];
        const pips = k === "heilkraut" ? esc(tx.leben(S.leben)) : u.kosten.map((_, i) => '<i class="' + (i < st ? "an" : "") + '"></i>').join("");
        return '<div class="eh-up' + (voll ? " voll" : "") + '"><span class="sym" aria-hidden="true">' + u.sym + '</span>' +
          '<span class="eh-up-text"><strong>' + esc(name) + '</strong><small>' + esc(text) + '</small><span class="eh-pips">' + pips + '</span></span>' +
          '<button type="button" class="eh-kauf" data-kauf="' + k + '"' + (kann ? "" : " disabled") + '>' + esc(voll ? tx.max : tx.kaufen(preis)) + '</button></div>';
      }).join("");
      return '<h5>' + esc(tx.hainGruppen[gr]) + '</h5>' + zeilen;
    }).join("");
    schleierAuf(
      '<h4>' + esc(tx.hain) + '</h4><p>' + esc(tx.hainText) + '</p>' +
      '<p class="eh-beutel">💰 ' + esc(tx.beutel(S.beutel)) + '</p>' + kleinodBesitzHtml() +
      '<div class="eh-hain">' + gruppen + '</div>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="weiterLevel">' + esc(tx.weiter) + '</button>' +
      '<button type="button" class="eh-leise" data-tun="schatz">' + esc(tx.schatzkammer) + '</button>', "hain");
  }
  function kaufen(k) {
    const u = UPS[k], st = S.up[k] || 0;
    if (st >= u.kosten.length || S.beutel < u.kosten[st]) return;
    if (k === "heilkraut" && S.leben >= MAX_LEBEN) return;
    S.beutel -= u.kosten[st]; S.up[k] = st + 1;
    if (k === "heilkraut") S.leben++;
    erfolgPruefen("hain");
    KLANG.kaufen(); speichern();
    const scroll = schleier.scrollTop;
    hainZeigen(); schleier.scrollTop = scroll;
  }

  function pauseZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.pause) + '</h4><p>' + esc(tx.pauseText) + '</p><button type="button" class="tav-knopf eh-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>' +
      '<button type="button" class="tav-knopf" data-tun="einst">' + esc(tx.einst.knopf) + '</button>' +
      '<button type="button" class="eh-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>', "pause");
  }
  let einstZurueck = "start";
  function einstZeigen() {
    const tx = t(), E = tx.einst, kannVib = !!navigator.vibrate;
    if (tafelArt !== "einst") einstZurueck = tafelArt;
    const regler = (k, label) => '<label class="eh-regler"><span>' + esc(label) + '</span><input type="range" min="0" max="100" step="5" value="' + Math.round(EINST[k] * 100) + '" data-einst="' + k + '"><output>' + (EINST[k] > 0 ? Math.round(EINST[k] * 100) + " %" : esc(E.aus)) + '</output></label>';
    schleierAuf('<h4>' + esc(E.titel) + '</h4>' +
      '<div class="eh-einst">' + regler("effekte", E.effekte) + regler("musik", E.musik) +
      '<label class="eh-schalter"><input type="checkbox" data-einst="vib"' + (EINST.vib ? " checked" : "") + (kannVib ? "" : " disabled") + '><span>' + esc(E.vib) + '</span></label>' +
      (kannVib ? "" : '<p class="eh-klein">' + esc(E.vibNein) + '</p>') + '</div>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="einstZurueck">' + esc(tx.zurueck) + '</button>', "einst");
  }
  function einstEingabe(e) {
    const el = e.target.closest("[data-einst]"); if (!el) return;
    const k = el.dataset.einst;
    if (k === "vib") { EINST.vib = el.checked; einstSichern(); if (EINST.vib) { letzteVib = 0; vib(80); } return; }
    EINST[k] = parseInt(el.value, 10) / 100; einstSichern();
    const out = el.parentNode.querySelector("output"); if (out) out.textContent = EINST[k] > 0 ? Math.round(EINST[k] * 100) + " %" : t().einst.aus;
    audio(); busseSetzen();
    if (e.type === "change") { if (k === "effekte") KLANG.gold(); else if (k === "musik" && EINST.musik > 0 && !MZ.an) { const g = S && S.R ? GEB[S.R.g].musik : "wald"; musikStart(g, 0); setTimeout(() => { if (zustand !== "spiel" && tafelArt === "einst" && !(S && S.R)) musikStop(); }, 3500); } }
    if (k === "musik" && EINST.musik <= 0) musikStop();
  }

  function spielEnde(nurNeu) {
    const tx = t();
    if (!nurNeu) {
      musikStop();
      zustand = "ende";
      speicherLoeschen();
      KLANG.verloren();
      const alt = parseInt(lies(rekordKey(S.stufe), "0"), 10);
      S.neuerRekord = S.punkte > alt && S.punkte > 0;
      if (S.neuerRekord) schreib(rekordKey(S.stufe), String(S.punkte));
      S.altRekord = alt;
      S.spruchStufe = S.lv >= KAMPAGNE ? "legende" : S.lv >= 15 ? "boss" : S.lv >= 9 ? "gut" : S.lv >= 3 ? "mittel" : "schwach";
      S.spruchIdx = Math.floor(Math.random() * 3);
      S.eingetragen = ""; S.sendet = false; S.fehler = ""; S.endgueltig = false; S.lokal = null; S.nameEingabe = null;
    }
    zustand = "ende";
    const spruch = tx.spruch[S.spruchStufe][S.spruchIdx];
    schleierAuf(
      '<h4>' + esc(tx.endeTitel) + '</h4>' +
      '<p class="eh-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + ' · ' + esc(tx.stufen[S.stufe]) + '</span></p>' +
      (S.neuerRekord && S.altRekord ? '<p class="eh-neu">' + esc(tx.neuRekord) + '</p>' : "") +
      '<dl class="eh-werte">' +
      '<dt>' + esc(tx.wert.level) + '</dt><dd>' + esc(levelName(S.lv)) + '</dd>' +
      '<dt>' + esc(tx.wert.gold) + '</dt><dd>💰 ' + S.goldGesamt + '</dd>' +
      '<dt>' + esc(tx.wert.erlegt) + '</dt><dd>' + S.erlegtGesamt + '</dd>' +
      '<dt>' + esc(tx.wert.schaetze) + '</dt><dd>' + S.schaetzeGesamt + '</dd>' +
      '</dl>' +
      '<p class="eh-spruch">„' + esc(spruch) + '“ <span>– Echo</span></p>' +
      eintragHtml(tx) +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="nochmal">' + esc(tx.nochmal) + '</button>', "ende");
    fussSetzen(); listeNeu();
  }

  function losSpielen() { zustand = "spiel"; schleierZu(); anwerfen(); if (MZ.k && S) musikStart(MZ.k, S.phase === "abwehr" ? (MZ.lage || 1) : 0); }

  function tafelKlick(e) {
    const st = e.target.closest("[data-stufe]");
    if (st && zustand === "start") {
      stufeWahl = st.dataset.stufe; schreib("imres-echohort-stufe", stufeWahl);
      startZeigen(); fussSetzen(); bestenLaden(stufeWahl);
      return;
    }
    const lvb = e.target.closest("[data-level]");
    if (lvb && tafelArt === "levelwahl") { audio(); einzelStarten(parseInt(lvb.dataset.level, 10)); return; }
    const zb = e.target.closest("[data-zauber]");
    if (zb && tafelArt === "nachRaub") { zauberUmschalten(zb.dataset.zauber); return; }
    const tb = e.target.closest("[data-talent]");
    if (tb && tafelArt === "druide") { talentLernen(tb.dataset.talent); return; }
    const klb = e.target.closest("[data-kleinod]");
    if (klb && tafelArt === "beute") { kleinodWaehlen(klb.dataset.kleinod); return; }
    const kb = e.target.closest("[data-kauf]");
    if (kb && tafelArt === "hain") { kaufen(kb.dataset.kauf); return; }
    if (e.target.closest(".eh-eintragen")) { eintragen(); return; }
    const b = e.target.closest("[data-tun]"); if (!b) return;
    const tun = b.dataset.tun;
    audio();
    if (tun === "neu") { loesch(SPEICHER); neuesSpiel(); S.speicherT = Date.now(); fussSetzen(); bestenLaden(S.stufe); introZeigen(); }
    else if (tun === "fortsetzen") { const sp = gespeichert(); if (!sp) { startZeigen(); return; } laden(sp); fussSetzen(); bestenLaden(S.stufe); if (S.angebot && S.angebot.length) kleinodZeigen(); else if (S.lv > 0) hainZeigen(); else introZeigen(); }
    else if (tun === "beute") kleinodZeigen();
    else if (tun === "tag" || tun === "tagNochmal") { musikStop(); tagZeigen(true); }
    else if (tun === "tagStart") tagStarten();
    else if (tun === "tagEintragen") tagEintragen();
    else if (tun === "raub") { raubzugStarten(); losSpielen(); }
    else if (tun === "abwehr") { abwehrStarten(); losSpielen(); }
    else if (tun === "hain") hainZeigen();
    else if (tun === "weiterLevel") introZeigen();
    else if (tun === "wiederholen") { if (S && S.einzel && !S.tag && "gartenStart" in S) S.garten = S.gartenStart ? JSON.parse(S.gartenStart) : null; introZeigen(); }
    else if (tun === "weiter") losSpielen();
    else if (tun === "beenden") { if (S && S.tag) { musikStop(); tagZeigen(true); } else if (S && S.einzel) levelwahlZeigen(); else spielEnde(); }
    else if (tun === "levelwahl") levelwahlZeigen();
    else if (tun === "schatz") schatzZeigen();
    else if (tun === "einst") einstZeigen();
    else if (tun === "einstZurueck") { tafelArt = einstZurueck; tafelNeu(); }
    else if (tun === "schatzZurueck") { tafelArt = schatzZurueck; tafelNeu(); }
    else if (tun === "druide") druideZeigen();
    else if (tun === "zumStart") { musikStop(); S = null; hgSchluessel = ""; startZeigen(); fussSetzen(); bestenLaden(stufeWahl); zeichnen(performance.now()); }
    else if (tun === "nochmal") { musikStop(); zustand = "start"; S = null; hgSchluessel = ""; startZeigen(); fussSetzen(); bestenLaden(stufeWahl); anwerfen(); }
  }

  function pausieren() {
    if (zustand !== "spiel") return;
    zustand = "pause"; musikStop();
    pauseZeigen();
  }

  /* ---------- Bestenliste: gemeinsam über Supabase, sonst auf diesem Gerät ---------- */
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
  /* Eintragsfeld: Name, Knopf und – nach einer Ablehnung – die freundliche Erklärung */
  function eintragFeld(T, name, knopf) {
    if (S.endgueltig) return '<p class="eh-fehler" role="alert">' + esc(S.fehler) + "</p>";
    if (S.nameEingabe != null) name = S.nameEingabe;
    return '<div class="eh-eintrag">' + ImresKuerzel.feld({ klasse: "eh-name", aus: S.sendet }) +
      knopf.replace(">", (S.sendet ? " disabled" : "") + ">") + esc(S.sendet ? T.sendet : T.eintragen) + "</button></div>" +
      (S.fehler ? '<p class="eh-fehler" role="alert">' + esc(S.fehler) + "</p>" : "");
  }
  function tafelBehalten(zeigen) { const y = schleier.scrollTop; zeigen(); schleier.scrollTop = y; }
  function senden(spiel, T, body, laden, finden, zeigen, istDa) {
    spiel.fehler = ""; spiel.sendet = true; tafelBehalten(zeigen);
    server("/rest/v1/rpc/hort_eintragen", body).then(() => laden().then(() => {
      spiel.sendet = false;
      const r = finden();
      if (r.i >= 0) meinEintrag = r.e.erstellt;
      spiel.eingetragen = r.i >= 0 ? T.eingetragen(r.i + 1) : T.eingetragenOhne;
      if (S === spiel && istDa()) tafelBehalten(zeigen); else listeNeu();
    }), f => {
      const F = fehlerText(f, T);
      spiel.sendet = false; spiel.fehler = F.text; spiel.endgueltig = !!F.endgueltig;
      return laden().then(() => {
        if (S !== spiel || !istDa()) return;
        tafelBehalten(zeigen);
        const fe = tafel.querySelector(".eh-name"); if (fe) { try { fe.focus({ preventScroll: true }); fe.select(); } catch (_) {} }
      });
    });
  }
  const besten = {}, serverOk = {}; let meinEintrag = null;
  const lokalLesen = () => {
    try {
      const v = JSON.parse(localStorage.getItem("imres-echohort-liste") || "{}");
      if (!v || typeof v !== "object" || Array.isArray(v)) return {};
      Object.keys(v).forEach(k => { if (!Array.isArray(v[k])) delete v[k]; });
      return v;
    } catch (_) { return {}; }
  };
  const sortieren = l => (Array.isArray(l) ? l : []).filter(e => e && typeof e === "object" && typeof e.punkte === "number" && isFinite(e.punkte)).sort((a, b) => b.punkte - a.punkte || b.level - a.level || String(a.erstellt).localeCompare(String(b.erstellt)));
  function bestenLaden(st) {
    return server("/rest/v1/hort_bestenliste?select=name,punkte,level,erstellt&stufe=eq." + st + "&order=punkte.desc,level.desc,erstellt.asc&limit=10")
      .then(l => { besten[st] = Array.isArray(l) ? l : []; serverOk[st] = true; })
      .catch(() => { serverOk[st] = false; besten[st] = sortieren(lokalLesen()[st] || []).slice(0, 10); })
      .then(listeNeu);
  }
  function listeNeu() {
    if (!listeEl) return;
    const T = t(), st = aktuelleStufe(), l = besten[st];
    if (!l) { listeEl.innerHTML = ""; return; }
    listeEl.innerHTML = '<h4>' + T.bestenliste + " · " + esc(T.stufen[st]) + "</h4>" +
      (l.length ? "<table><thead><tr>" + T.spalten.map(x => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" +
        l.map((e, i) => "<tr" + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.punkte + "</td><td>" + e.level + "</td></tr>").join("") +
        "</tbody></table>" : '<p class="eh-leer">' + esc(T.leer) + "</p>") +
      (serverOk[st] === false ? '<p class="eh-leer">' + esc(T.nurHier) + "</p>" : "");
  }
  function eintragHtml(T) {
    if (!S || S.punkte <= 0) return "";
    if (S.eingetragen) return '<p class="eh-eingetragen">' + esc(S.eingetragen) + "</p>";
    const name = lies("imres-echohort-name", "") || lies("imres-diebesnacht-name", "") || lies("imres-waldlauf-name", "") || lies("imres-auftritt-name", "");
    return eintragFeld(T, name, '<button type="button" class="tav-knopf eh-eintragen">');
  }
  function eintragen() {
    if (!S || zustand !== "ende" || S.eingetragen || S.sendet || S.endgueltig) return;
    const feld = tafel.querySelector(".eh-name"), name = ImresKuerzel.wert(feld);
    if (!name) { if (feld) feld.focus(); return; }
    schreib("imres-echohort-name", name);
    const T = t(), st = S.stufe, spiel = S;
    const e = { name, punkte: S.punkte, level: S.lv + 1, erstellt: new Date().toISOString() };
    const lok = lokalLesen(), alt = spiel.lokal; lok[st] = sortieren((lok[st] || []).filter(x => !alt || x.erstellt !== alt).concat([e])).slice(0, 10);
    schreib("imres-echohort-liste", JSON.stringify(lok));
    spiel.lokal = e.erstellt; spiel.nameEingabe = name;
    senden(spiel, T, { p_name: name, p_stufe: st, p_punkte: e.punkte, p_level: e.level }, () => bestenLaden(st), () => {
      const l = besten[st] || [], i = l.findIndex(x => x.name === name && x.punkte === e.punkte && x.level === e.level);
      return { i, e: l[i] };
    }, () => spielEnde(true), () => zustand === "ende");
  }

  /* ---------- Eingabe ---------- */
  function punkt(ev) {
    const r = leinwand.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
  }
  function knopfDruck(id) {
    if (S.phase === "raub") {
      if (id.startsWith("form:")) formWaehlen(id.slice(5));
      else if (id === "genug") genug();
    } else {
      const A = S.A;
      if (id.startsWith("bau:")) { const k = id.slice(4); if (A.bauTyp === k) bauen(k); else { A.bauTyp = k; KLANG.griff(); } }
      else if (id.startsWith("tier:")) { const k = id.slice(5); if (A.tierTyp === k) tierBauen(k); else { A.tierTyp = k; KLANG.griff(); } }
      else if (id.startsWith("setz:")) { const i = parseInt(id.slice(5), 10); if (A.setzWahl === i) setzlingPflanzen(i); else { A.setzWahl = i; KLANG.griff(); } }
      else if (id.startsWith("tab:")) { A.bauTab = id.slice(4); KLANG.griff(); }
      else if (id === "pflanzen") { if (A.bauTab === "tiere") tierBauen(A.tierTyp); else if (A.bauTab === "setz") setzlingPflanzen(A.setzWahl || 0); else bauen(A.bauTyp); }
      else if (id.startsWith("zweig:")) verstaerken(id.slice(6));
      else if (id === "zielmodus") zielWechseln();
      else if (id === "staerker") verstaerken();
      else if (id === "raus") ausreissen();
      else if (id === "jetzt") { if (A.welle < 0) { A.halt = false; A.vorT = 0.01; } else welleRufen(); }
      else if (id.startsWith("zauber:")) { S.A.aktiv = parseInt(id.slice(7), 10); KLANG.griff(); }
      else if (id === "schnell") { S.A.schnell = S.A.schnell >= 3 ? 1 : (S.A.schnell || 1) + 1; schreib("imres-echohort-schnell", String(S.A.schnell)); KLANG.griff(); }
      else if (id === "zuletzt") wieZuletzt();
    }
  }
  function leinwandDruck(p) {
    const k = (S.knoepfe || []).find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
    if (k) { if (k.id !== "nix" && k.id !== "tafel") knopfDruck(k.id); return; }
    if (p.y >= LEISTE) return;
    if (S.phase === "raub") raubTippen(p); else abwehrTippen(p);
  }
  leinwand.addEventListener("pointerdown", ev => {
    if (zustand !== "spiel" || !S) return;
    ev.preventDefault();
    audio();
    const p = punkt(ev);
    const k = (S.knoepfe || []).find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
    if (k) { if (k.id !== "nix" && k.id !== "tafel") knopfDruck(k.id); return; }
    if (p.y >= LEISTE) return;
    if (S.phase === "raub") raubTippen(p); else abwehrTippen(p);
  });
  leinwand.addEventListener("contextmenu", ev => ev.preventDefault());
  document.addEventListener("keydown", e => {
    if (!sichtbar) return;
    if (zustand === "spiel" && (e.key === "Escape" || e.key === "p" || e.key === "P")) { e.preventDefault(); pausieren(); return; }
    if (zustand === "spiel" && S && S.phase === "raub" && (e.key === " " || e.key === "ArrowDown")) {
      if (document.activeElement && /INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)) return;
      e.preventDefault(); raubTippen({ x: 0, y: 0 });
    }
  });

  /* ---------- Größe ---------- */
  function groesse() {
    const r = leinwand.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    leinwand.width = Math.round(r.width * dpr); leinwand.height = Math.round(r.height * dpr);
    skala = leinwand.width / W;
    zeichnen(performance.now());
  }

  /* ---------- Stil ---------- */
  const css = document.createElement("style");
  css.textContent = `
.echohort .eh-steuerung { font-size: .86rem; color: var(--ash); font-style: italic; }
.eh-buehne { position: relative; width: 100%; max-width: min(100%, calc(76vh * .8)); justify-self: center; aspect-ratio: 4 / 5; border: 1px solid var(--line); background: #0b0a12; overflow: hidden; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; box-shadow: 0 14px 30px rgba(0,0,0,.45); }
.eh-buehne canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: pan-y; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.eh-buehne.laeuft canvas { touch-action: none; }
.eh-schleier { position: absolute; inset: 0; display: grid; place-items: center; padding: clamp(.7rem, 3vw, 1.4rem); background: rgba(9,8,15,.72); text-align: center; overflow-y: auto; overscroll-behavior: contain; }
.eh-schleier[hidden] { display: none; }
.eh-tafel { display: grid; gap: .55rem; justify-items: center; width: 100%; max-width: 30rem; margin: auto 0; }
.eh-tafel h4 { font-family: var(--name); font-weight: 400; font-size: clamp(1.45rem, 5.5vw, 2rem); line-height: 1.05; color: var(--vellum); margin: 0; }
.eh-tafel h5 { font-family: var(--display); font-weight: 400; font-size: .74rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .5rem 0 .1rem; justify-self: start; }
.eh-tafel p { color: var(--ash); font-size: .92rem; margin: 0; }
.eh-tafel .tav-knopf { justify-self: center; }
.eh-tafel .eh-haupt { font-size: 1rem; padding: .55rem 1.3rem; background: color-mix(in srgb, var(--ember) 14%, transparent); }
.eh-tafel .eh-ober { font-family: var(--display); font-size: .74rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); }
.eh-tafel .eh-erzaehl { font-family: var(--hand); font-size: 1.22rem; line-height: 1.2; color: var(--vellum); }
.eh-tafel .eh-neu { color: #cfe6a8; font-weight: 600; }
.eh-tafel .eh-warn { color: var(--ember); font-size: .86rem; }
.eh-tafel .eh-klein { font-size: .8rem; }
.eh-tafel .eh-gross { font-family: var(--display); font-size: clamp(2.2rem, 9vw, 3rem); color: var(--ember); line-height: 1; }
.eh-gross span { font-size: .4em; color: var(--ash); }
.eh-werte { display: grid; grid-template-columns: auto auto; gap: .15rem 1.1rem; font-size: .9rem; margin: 0; text-align: left; }
.eh-werte dt { color: var(--ash); } .eh-werte dd { margin: 0; color: var(--vellum); font-weight: 600; text-align: right; }
.eh-tafel .eh-spruch { font-family: var(--hand); font-size: 1.25rem; line-height: 1.15; color: var(--ember); }
.eh-spruch span { font-family: var(--body); font-size: .8rem; color: var(--ash); white-space: nowrap; }
.eh-tafel .eh-beutel { font-weight: 600; color: #ffd34d; }
.eh-hain { display: grid; gap: .35rem; width: 100%; text-align: left; }
.eh-up { display: grid; grid-template-columns: auto 1fr auto; gap: .55rem; align-items: center; padding: .4rem .55rem; background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; box-shadow: 0 4px 10px rgba(0,0,0,.35); }
.eh-up.voll { opacity: .62; }
.eh-up .sym { font-size: 1.35rem; line-height: 1; }
.eh-up-text { display: grid; gap: .05rem; min-width: 0; }
.eh-up strong { font-family: var(--name); font-weight: 400; font-size: 1rem; line-height: 1.1; color: #1d1610; }
.eh-up small { font-size: .76rem; line-height: 1.2; color: #5a4a36; }
.eh-pips { display: flex; gap: 3px; font-size: .7rem; color: var(--blood); }
.eh-pips i { display: block; width: 8px; height: 8px; border-radius: 50%; border: 1px solid #8a6440; }
.eh-pips i.an { background: #a8701e; border-color: #a8701e; }
.eh-kauf { border: 1px solid #8a6440; background: #2a2118; color: #ffd34d; font: inherit; font-size: .8rem; font-weight: 600; padding: .35rem .55rem; cursor: pointer; white-space: nowrap; }
.eh-kauf:disabled { background: transparent; color: #8a7a62; cursor: default; }
.eh-kauf:not(:disabled):hover, .eh-kauf:not(:disabled):focus-visible { background: #4a3424; outline: none; }
.eh-leise { background: none; border: 0; color: var(--ash); font: inherit; font-size: .85rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: .2rem; }
.eh-pause { position: absolute; top: 4px; right: 4px; z-index: 2; display: none; width: 2.1rem; height: 2.1rem; padding: 0; border: 1px solid var(--line); border-radius: 50%; background: rgba(9,8,15,.6); color: var(--vellum); font-size: .75rem; letter-spacing: -.1em; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.eh-pause:hover, .eh-pause:focus-visible { border-color: var(--ember); color: var(--ember); }
.eh-buehne.laeuft .eh-pause { display: grid; place-items: center; }
.eh-stufen { display: flex; flex-wrap: wrap; justify-content: center; gap: .3rem; }
.eh-stufen button { border: 1px solid var(--line); background: rgba(9,8,15,.4); color: var(--vellum); font: inherit; font-size: .82rem; padding: .38rem .55rem; white-space: nowrap; cursor: pointer; }
.eh-stufen button[aria-checked="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.eh-tafel .eh-stufen-text { font-style: italic; font-size: .85rem; min-height: 1.3em; }
.eh-eintrag { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem; }
.eh-name { background: rgba(0,0,0,.35); border: 1px solid var(--line); color: var(--vellum); font: inherit; font-size: .9rem; padding: .4rem .6rem; width: 10.5rem; min-width: 0; }
.eh-eintrag .tav-knopf { font-size: .88rem; padding: .4rem .8rem; }
.eh-tafel .eh-eingetragen { color: var(--ember); }
.eh-tafel .eh-fehler { color: #e08a7e; font-size: .88rem; margin: 0; }
.eh-eintrag input:disabled, .eh-eintrag button:disabled { opacity: .6; }
.eh-buehne button, .eh-tafel button, .eh-fuss button { touch-action: manipulation; }
.eh-liste { width: 100%; max-width: min(100%, calc(76vh * .8)); justify-self: center; }
.eh-liste:empty { display: none; }
.eh-liste h4 { font-family: var(--display); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .2rem 0 .4rem; font-weight: 400; }
.eh-liste table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.eh-liste th { text-align: left; font-weight: normal; color: var(--ash); font-size: .75rem; border-bottom: 1px solid var(--line); padding: .25rem .4rem; }
.eh-liste td { padding: .3rem .4rem; border-bottom: 1px solid rgba(235,226,204,.06); }
.eh-liste td:nth-child(3), .eh-liste th:nth-child(3), .eh-liste td:nth-child(4), .eh-liste th:nth-child(4) { text-align: right; }
.eh-liste tr.mein td { color: var(--ember); }
.eh-leer { color: var(--ash); font-size: .85rem; font-style: italic; margin: .3rem 0 0; }
.eh-tafel .eh-mond { font-family: var(--display); font-size: 1.1rem; color: #d8d0ff; text-shadow: 0 0 10px rgba(200,190,255,.5); }
.eh-talent { background: linear-gradient(172deg, #e4e0f4, #c8c2e0); }
.eh-talent .eh-kauf { background: #23203a; color: #e8e4ff; border-color: #6a62a0; }
.eh-talent .eh-pips i.an { background: #6a62a0; border-color: #6a62a0; }
.eh-einst { display: grid; gap: .7rem; width: 100%; max-width: 22rem; text-align: left; }
.eh-regler { display: grid; grid-template-columns: 7.5rem 1fr 3.2rem; gap: .5rem; align-items: center; color: var(--vellum); font-size: .92rem; }
.eh-regler input { width: 100%; accent-color: #e0a046; }
.eh-regler output { text-align: right; color: var(--ember); font-weight: 600; font-size: .85rem; }
.eh-schalter { display: flex; gap: .55rem; align-items: center; color: var(--vellum); font-size: .92rem; cursor: pointer; }
.eh-schalter input { width: 1.15rem; height: 1.15rem; accent-color: #e0a046; }
.eh-toast { position: absolute; left: 50%; top: 12%; z-index: 5; display: flex; gap: .55rem; align-items: center; width: max-content; max-width: 88%; padding: .5rem .8rem; transform: translate(-50%, -12px); opacity: 0; pointer-events: none;
  background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; box-shadow: 0 10px 24px rgba(0,0,0,.5); border-left: 4px solid #e0a046; transition: opacity .3s, transform .3s; text-align: left; }
.eh-toast.an { opacity: 1; transform: translate(-50%, 0); }
.eh-toast .sym { font-size: 1.6rem; line-height: 1; }
.eh-toast strong { display: block; font-family: var(--name); font-weight: 400; font-size: 1rem; color: #1d1610; }
.eh-toast small { display: block; font-size: .78rem; color: #5a4a36; }
.eh-relikte { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .4rem; width: 100%; }
.eh-relikt { display: grid; justify-items: center; gap: .1rem; padding: .4rem .2rem; background: rgba(224,160,70,.08); border: 1px solid rgba(224,160,70,.35); }
.eh-relikt img { width: 48px; height: 48px; }
.eh-relikt .frage { width: 48px; height: 48px; display: grid; place-items: center; font-family: var(--display); font-size: 1.6rem; color: rgba(235,226,204,.25); }
.eh-relikt strong { font-family: var(--name); font-weight: 400; font-size: .82rem; line-height: 1.05; color: var(--vellum); }
.eh-relikt small { font-size: .66rem; color: var(--ash); line-height: 1.1; }
.eh-relikt.fehlt { background: rgba(0,0,0,.25); border-color: var(--line); }
.eh-relikt.fehlt strong { color: var(--ash); }
.eh-trophs { display: grid; gap: .3rem; width: 100%; text-align: left; }
.eh-troph { display: grid; grid-template-columns: auto 1fr; gap: .55rem; align-items: center; padding: .3rem .5rem; background: rgba(0,0,0,.25); border: 1px solid var(--line); opacity: .6; }
.eh-troph.hat { opacity: 1; border-color: rgba(224,160,70,.5); background: rgba(224,160,70,.1); }
.eh-troph .sym { font-size: 1.3rem; }
.eh-troph strong { display: block; font-family: var(--name); font-weight: 400; font-size: .95rem; color: var(--vellum); }
.eh-troph small { display: block; font-size: .74rem; color: var(--ash); }
.eh-zauberwahl { width: 100%; display: grid; gap: .3rem; }
.eh-zw-liste { display: grid; gap: .3rem; }
.eh-kleinode { width: 100%; }
.eh-kleinode .eh-zw { padding: .55rem .7rem; } .eh-kleinode .eh-zw:hover, .eh-kleinode .eh-zw:focus-visible { border-color: var(--ember); background: rgba(224,160,70,.16); }
.eh-kleinode .sym { font-size: 1.7rem; }
.eh-tafel .eh-laune { display: grid; gap: .1rem; width: 100%; text-align: left; font-size: .84rem; background: rgba(159,214,236,.07); border-left: 3px solid #9fd6ec; padding: .35rem .55rem; }
.eh-laune b { color: #cfeaf4; } .eh-laune .plus { color: #cfe6a8; } .eh-laune .minus { color: #e8a090; }
.eh-besitz { display: flex; flex-wrap: wrap; gap: .25rem .45rem; justify-content: center; align-items: center; font-size: .8rem; color: var(--vellum); }
.eh-besitz .eh-ober { width: 100%; }
.eh-besitz .eh-kl { background: rgba(224,160,70,.1); border: 1px solid rgba(224,160,70,.3); padding: .1rem .4rem; }
.eh-tagkl { flex-direction: column; align-items: stretch; text-align: left; }
.eh-tagliste { width: 100%; }
.eh-tagliste table { width: 100%; border-collapse: collapse; font-size: .85rem; color: var(--vellum); }
.eh-tagliste td { padding: .15rem .3rem; border-bottom: 1px solid var(--line); } .eh-tagliste td:last-child { text-align: right; }
.eh-tagliste tr.mein td { color: #ffd34d; }
.eh-zw { display: grid; grid-template-columns: auto 1fr; gap: .5rem; align-items: center; text-align: left; padding: .35rem .55rem; border: 1px solid var(--line); background: rgba(9,8,15,.45); color: var(--vellum); font: inherit; cursor: pointer; }
.eh-zw[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.16); }
.eh-zw:disabled { cursor: default; }
.eh-zw .sym { font-size: 1.3rem; }
.eh-zw strong { display: block; font-size: .88rem; } .eh-zw small { display: block; font-size: .74rem; color: var(--ash); }
.eh-tafel .eh-regel { font-size: .84rem; color: #e8d8b8; background: rgba(224,160,70,.08); border-left: 3px solid var(--ember); padding: .35rem .55rem; text-align: left; }
.eh-tafel .eh-regel b { color: var(--ember); }
@media (max-width: 480px) { .eh-relikte { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .25rem; } .eh-relikt img, .eh-relikt .frage { width: 38px; height: 38px; } .eh-relikt strong { font-size: .72rem; } .eh-relikt small { display: none; } }
.eh-vorschau { width: 100%; display: grid; gap: .2rem; text-align: left; background: rgba(0,0,0,.28); border: 1px solid var(--line); padding: .45rem .6rem; }
.eh-vorschau .eh-ober { text-align: center; margin-bottom: .1rem; }
.eh-vz { display: grid; grid-template-columns: 2.1rem auto 1fr; gap: .45rem; align-items: baseline; font-size: .84rem; }
.eh-vz-n { color: var(--ember); font-weight: 700; text-align: right; }
.eh-vz-name { color: var(--vellum); font-weight: 600; white-space: nowrap; }
.eh-vz-eig { color: var(--ash); font-size: .76rem; font-style: italic; }
.eh-vz.boss .eh-vz-n, .eh-vz.boss .eh-vz-name { color: #e07a6a; }
.eh-tafel .eh-sterne { font-size: 2rem; line-height: 1; letter-spacing: .2rem; color: rgba(235,226,204,.18); }
.eh-sterne .an { color: #ffd34d; text-shadow: 0 0 10px rgba(255,211,77,.55); }
.eh-ziele { list-style: none; margin: 0; padding: 0; font-size: .82rem; color: var(--ash); text-align: left; }
.eh-ziele li.ja { color: #cfe6a8; }
.eh-lw-gitter { display: grid; gap: .3rem; width: 100%; }
.eh-lw-zeile { display: grid; grid-template-columns: 1fr repeat(3, 3.6rem); gap: .3rem; align-items: center; }
.eh-lw-name { text-align: left; font-family: var(--name); font-size: .95rem; color: var(--vellum); line-height: 1.1; }
.eh-lw { display: grid; gap: .05rem; justify-items: center; padding: .25rem .1rem; border: 1px solid var(--line); background: rgba(9,8,15,.45); color: var(--vellum); font: inherit; cursor: pointer; }
.eh-lw b { font-size: .8rem; } .eh-lw small { font-size: .72rem; color: #ffd34d; letter-spacing: .05em; }
.eh-lw:disabled { opacity: .4; cursor: default; }
.eh-lw:not(:disabled):hover, .eh-lw:not(:disabled):focus-visible { border-color: var(--ember); outline: none; }
.eh-tafel .tav-knopf small { font-size: .78em; color: #ffd34d; }
@media (max-width: 480px) { .eh-vz { font-size: .78rem; grid-template-columns: 1.8rem auto 1fr; gap: .3rem; } .eh-vz-eig { font-size: .7rem; } .eh-lw-zeile { grid-template-columns: 1fr repeat(3, 3.1rem); } .eh-lw-name { font-size: .85rem; } }
.eh-fuss { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem; font-size: .88rem; color: var(--ash); }
.eh-ton { background: none; border: 1px solid var(--line); color: var(--ash); font: inherit; font-size: .84rem; padding: .3rem .75rem; cursor: pointer; }
.eh-ton:hover { color: var(--vellum); border-color: var(--ember); }
@media (max-width: 480px) {
  .eh-tafel { gap: .42rem; }
  .eh-tafel h4 { font-size: 1.35rem; }
  .eh-tafel p { font-size: .85rem; }
  .eh-tafel .eh-erzaehl { font-size: 1.08rem; }
  .eh-tafel .eh-gross { font-size: 2.1rem; }
  .eh-werte { font-size: .8rem; }
  .eh-up { gap: .4rem; padding: .32rem .45rem; }
  .eh-up small { font-size: .7rem; }
  .eh-kauf { font-size: .74rem; padding: .3rem .4rem; }
  .eh-tafel .eh-haupt { padding: .4rem 1.1rem; font-size: .95rem; }
}
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  aufbauen();
  bestenLaden(stufeWahl);
  medaillonLaden();
  portraetsLaden();
  startZeigen();
  if (window.ResizeObserver) new ResizeObserver(groesse).observe(buehne); else window.addEventListener("resize", groesse);
  groesse();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => zeichnen(performance.now()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(eintraege => {
      sichtbar = eintraege[0].isIntersecting;
      if (!sichtbar) musikStop();
      if (sichtbar) anwerfen(); else pausieren();
    }, { threshold: 0.15 }).observe(buehne);
  } else { sichtbar = true; anwerfen(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) { pausieren(); musikStop(); } else anwerfen(); });
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); texteSetzen(); zeichnen(performance.now()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (/eh-test/.test(location.hash + location.search)) window.__echohort = { set tempo(v) { testTempo = v; }, zeichnen, abwehrUpdate, raubUpdate, effekteUpdate, gartenSync, zauberWirken, bauen, tierBauen, verstaerken, setzlingPflanzen, kosten, tierKosten, tierAnzahl, welleRufen, get S() { return S; }, set S(v) { S = v; }, get zustand() { return zustand; }, raubzugStarten, abwehrStarten, raubzugEnde, ergebnisZeigen, helferStart, levelwahlZeigen, hainZeigen, introZeigen, neuesSpiel, KAMPAGNE, FEINDE, feindNeu, get MZ() { return MZ; }, musikLage, stueckBauen, tagZeigen, tagStarten, tagInfo, kleinodZeigen, wieZuletzt, mod, ergebnisZeigen: n => ergebnisZeigen(n), speichern, gespeichert, laden, spielEnde };
  /* ---------- Controller (controller.js) ---------- */
  root._pad = {
    zustand: () => zustand, W, H, LEISTE, leinwand,
    phase: () => S && S.phase,
    knoepfe: () => ((S && S.knoepfe) || []).filter(b => b.id !== "nix" && b.id !== "tafel"),
    plaetze: () => (S && S.A && S.A.plaetze || []).map(q => ({ x: q.x, y: q.y })),
    druck(p) { if (zustand !== "spiel" || !S) return; audio(); leinwandDruck(p); },
    pause: () => pausieren()
  };
})();
