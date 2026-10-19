/* =====================================================================
   EZEKIELS LANGE NACHT – Schleich- und Taschendiebspiel in der Taverne
   Fünf Nächte mit je drei Stufen (Schankraum, Gewölbe, Hinterzimmer),
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
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mischen = l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Schurken-Probe", titel: "Ezekiels lange Nacht",
      text: "Fünf Nächte, fünfzehn Orte: Ezekiel leert fremde Taschen, bleibt im Schatten, knackt jede Truhe und verschwindet, bevor jemand „Dieb!“ rufen kann. Was er dabei denkt, weiß nur Ezekiel.",
      steuerung: "Tippe auf einen Ort, um dorthin zu schleichen. Tippe Gäste, Wachen, Kerzen und Truhen an, um zu tun, was ein Schurke eben tut.",
      start: "▶ In die Nacht", los: "▶ Los", weiter: "▶ Weiter", nochmal: "↻ Neue Nacht", beenden: "Nacht beenden", erneut: "▶ Noch einmal",
      pause: "Im Schatten verharren", pauseText: "Niemand bemerkt dich, solange du stillhältst.",
      naechte: [["Phandalin", "Zum Schlafenden Riesen"], ["Die Schlossruine", "Bei den Roten Roben"], ["Donnerbaum", "Der verfallene Wachturm"], ["Gracklstugh", "Die Stadt der Duergar"], ["Das Unterreich", "Ilvaras Festung"]],
      nacht: n => "Nacht " + n, endlos: k => "Endlose Nacht · " + k, endlosUnter: "Die Nacht nimmt kein Ende",
      kurz: (n, s) => "N" + n + " · " + s + "/3", kurzEndlos: k => "∞ " + k,
      lv: [
        ["Der Schankraum", "Tippe auf einen Ort, um dorthin zu schleichen. Tippe Gäste an, um sie zu bestehlen – am besten von hinten. Einer trägt den Kellerschlüssel."],
        ["Der Weinkeller", "Tippe Kerzen an, um sie auszupusten – Schatten verbergen dich. In Fässern bist du unsichtbar. Aber Wachen zünden Kerzen wieder an."],
        ["Glasstabs Versteck", "Tippe Wachen von hinten an, um sie auszuschalten – das macht Lärm. Truhen knackst du, indem du tippst, sobald die Nadel im goldenen Feld steht."],
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
        ["Das Grab", "Hier ruht eine Klinge, die leuchtet wie ein Sonnenaufgang. Trägst du sie, leuchtest du mit – und alle sehen dich."]
      ],
      ziel: { schluessel: "Stiehl den Schlüssel", truhe: "Knacke die Truhe", frei: "Finde den Ausgang", schwert: "Hol dir die Klinge", ausgang: "✓ Zum Ausgang!" },
      zielWort: "Ziel: ",
      gold: n => "+" + n + " Gold", leer: "Leer.", schluesselDa: "Schlüssel!", he: "He!", wache: "Wache!", fehler: "Daneben!", offen: "Offen!",
      wegFrei: "Der Weg ist frei!", aus: "Ausgeschaltet", zuGross: "Zu groß.", wirtNein: "Der Wirt? Er schenkt doch aus.",
      pfft: "Pfft", wuff: "Wuff!", knarr: "Knarr …", klirr: "Klirr!", robe: "Verkleidet", schritt: "Schattenschritt!", zuWeit: "Zu weit.",
      keinWeg: "Kein Weg dorthin.", zielen: "Wohin werfen?", rexGut: "Rex wedelt.", lieberNicht: "Lieber nicht.", gaehn: "Gähn …", bruell: "GRAAAH!",
      drache: "Venomfang erwacht!", schwertDa: "Die Klinge leuchtet!", erwischt: "Erwischt!", erwischtText: n => n > 0 ? "Noch " + n + (n === 1 ? " Leben." : " Leben.") + " Die Wache schleift dich zurück an den Anfang." : "",
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
      rast: "Atempause im Schatten", rastText: "Wähle eine Gabe für die nächste Stufe.",
      stufenTitel: "Schwierigkeit", stufen: { lehrling: "🕯 Lehrling", schurke: "🗡 Schurke", legende: "😈 Destroyer" },
      stufenText: { lehrling: "Langsamere, kurzsichtige Wachen. 5 Leben.", schurke: "Die Nacht, wie Ezekiel sie kennt. 3 Leben.", legende: "Wache Augen, schnelle Beine. 2 Leben." },
      nachtWahl: "Beginne in", pauseKnopf: "Pause", muenzeKnopf: "Münze werfen",
      bestenliste: "🏆 Bestenliste", nurHier: "Noch nur auf diesem Gerät gespeichert.", leer2: "Noch niemand – sei der erste Meisterdieb!",
      eintragen: "🏆 Eintragen", deinName: "Dein Name", eingetragen: p => "Eingetragen – Platz " + p + "!", eingetragenOhne: "Eingetragen!",
      spalten: ["#", "Name", "Gold", "Stufe"],
      stufe: (a, b) => "Stufe " + a + "/" + b,
      gaben: {
        umhang: [["Schattenumhang", "Wachen bemerken dich langsamer."], ["Mantel der Nacht", "Noch langsamer."]],
        sohlen: [["Leise Sohlen", "Du schleichst schneller."], ["Katzenpfoten", "Noch schneller."]],
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
      wert: { stufe: "Erreicht", bestohlen: "Bestohlen", aus: "Ausgeschaltet", geist: "Ungesehen" },
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
      text: "Five nights, fifteen places: Ezekiel empties strangers' pockets, stays in the shadows, cracks every chest and vanishes before anyone can shout \"Thief!\". What he is thinking, only Ezekiel knows.",
      steuerung: "Tap a spot to sneak there. Tap guests, guards, candles and chests to do what a rogue does.",
      start: "▶ Into the night", los: "▶ Go", weiter: "▶ Continue", nochmal: "↻ New night", beenden: "End the night", erneut: "▶ Try again",
      pause: "Frozen in the shadows", pauseText: "Nobody notices you as long as you stay still.",
      naechte: [["Phandalin", "The Sleeping Giant"], ["The castle ruin", "Among the Red Robes"], ["Thundertree", "The crumbling watchtower"], ["Gracklstugh", "City of the duergar"], ["The Underdark", "Ilvara's fortress"]],
      nacht: n => "Night " + n, endlos: k => "Endless night · " + k, endlosUnter: "The night never ends",
      kurz: (n, s) => "N" + n + " · " + s + "/3", kurzEndlos: k => "∞ " + k,
      lv: [
        ["The taproom", "Tap a spot to sneak there. Tap guests to pick their pockets – best from behind. One of them carries the cellar key."],
        ["The wine cellar", "Tap candles to blow them out – shadows hide you. In barrels you are invisible. But guards light candles again."],
        ["Glasstaff's hideout", "Tap guards from behind to take them down – it makes noise. Crack chests by tapping when the needle is in the golden field."],
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
        ["The tomb", "Here rests a blade that shines like a sunrise. Once you carry it, you shine too – and everyone sees you."]
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
      rast: "A breather in the shadows", rastText: "Choose a gift for the next stage.",
      stufenTitel: "Difficulty", stufen: { lehrling: "🕯 Apprentice", schurke: "🗡 Rogue", legende: "😈 Destroyer" },
      stufenText: { lehrling: "Slower, short-sighted guards. 5 lives.", schurke: "The night as Ezekiel knows it. 3 lives.", legende: "Sharp eyes, quick legs. 2 lives." },
      nachtWahl: "Start in", pauseKnopf: "Pause", muenzeKnopf: "Throw a coin",
      bestenliste: "🏆 Leaderboard", nurHier: "Only saved on this device for now.", leer2: "Nobody yet – be the first master thief!",
      eintragen: "🏆 Submit", deinName: "Your name", eingetragen: p => "Submitted – rank " + p + "!", eingetragenOhne: "Submitted!",
      spalten: ["#", "Name", "Gold", "Stage"],
      stufe: (a, b) => "Level " + a + "/" + b,
      gaben: {
        umhang: [["Shadow cloak", "Guards notice you more slowly."], ["Cloak of night", "Even more slowly."]],
        sohlen: [["Soft soles", "You sneak faster."], ["Cat's paws", "Even faster."]],
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
      wert: { stufe: "Reached", bestohlen: "Pickpocketed", aus: "Taken down", geist: "Unseen" },
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

  /* ---------- Welt ---------- */
  const COLS = 12, ROWS = 14, W = 400, C = W / COLS, OY = 42, GH = ROWS * C, H = 560, FUSS_Y = OY + GH;
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
    hund:      { sicht: 2.8, halb: 0.9, tempo: 1.7, jagd: 3.0, dunkel: 2.2, r: 0.27, mantel: "#7a5e44", kopf: "#8e6e50", hund: true, nase: 1.75 },
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
      truhe: { gold: 80, pins: 4, ziel: true } },
    { n: 2, boden: "stein", ziel: "schluessel",
      karte: ["############", "#R...#..c..#", "#....#.o.o.#", "#.O..#.....#", "#....#.o.o.#", "##.###.....#", "#.....c....#", "#..........#", "#O...###.###", "#....#.....#", "#.c..#..O..#", "#....#.....A", "#S...#.....#", "############"],
      wachen: [{ typ: "rotrobe", weg: [[10, 7], [1, 7]] }, { typ: "rotrobe", weg: [[10, 12], [6, 12], [6, 9], [10, 9]] }, { typ: "rotrobe", weg: [[10, 1]], blicke: ["d", "l"] }],
      gaeste: [{ x: 6, y: 2, dir: "r", gold: 14, typ: "rotrobe", betrunken: true }, { x: 7, y: 3, dir: "u", gold: 16, typ: "rotrobe", betrunken: true }, { x: 8, y: 4, dir: "r", gold: 18, typ: "rotrobe", betrunken: true }, { x: 10, y: 2, dir: "l", gold: 12, typ: "rotrobe", betrunken: true, key: true }], nezna: "katze" },
    { n: 2, boden: "stein", ziel: "frei",
      karte: ["############", "#S.#......$#", "#..#.c.....#", "#.O#..##.O.#", "#..#..##...#", "#..........#", "##.##..##.##", "#.....L....#", "#.O........#", "##.##..##.##", "#..........#", "#.c..##..O.#", "#$...##....A", "############"],
      wachen: [{ typ: "rotrobe", weg: [[10, 5], [1, 5]] }, { typ: "rotrobe", weg: [[10, 8], [1, 8], [1, 7], [10, 7]] }, { typ: "rotrobe", weg: [[1, 10], [10, 10]] }, { typ: "rotrobe", weg: [[8, 2]], blicke: ["l", "d", "r"] }] },
    { n: 2, boden: "stein", ziel: "truhe",
      karte: ["############", "#..c.=K=.c.#", "#..........#", "#.o.o..o.o.#", "#..........#", "#.o.o..o.o.#", "#..........#", "#O........O#", "####.##.####", "#R...#.....#", "#..c.#..L..#", "#....#.....#", "#S.........A", "############"],
      wachen: [{ typ: "rotrobe", weg: [[10, 6], [1, 6], [1, 4], [10, 4]] }, { typ: "rotrobe", weg: [[2, 2]], blicke: ["r", "d"] }, { typ: "rotrobe", weg: [[10, 9], [6, 9], [6, 11], [10, 11]] }],
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
      wachen: [{ typ: "duergar", weg: [[10, 6], [4, 6], [4, 4], [10, 4]] }, { typ: "duergar", weg: [[10, 8], [6, 8], [6, 11], [10, 11]] }, { typ: "wirt", weg: [[9, 2]], blicke: ["l"] }],
      gaeste: [{ x: 2, y: 4, dir: "u", gold: 14, typ: "duergar" }, { x: 6, y: 3, dir: "l", gold: 16 }, { x: 7, y: 5, dir: "l", gold: 15, typ: "duergar", key: true }, { x: 3, y: 6, dir: "u", gold: 12 }, { x: 8, y: 10, dir: "u", gold: 18, typ: "duergar" }, { x: 9, y: 6, gold: 22, wandert: true, typ: "duergar" }], nezna: "katze" },
    { n: 4, boden: "schmiede", ziel: "frei",
      karte: ["############", "#S...#F#...#", "#....#.#.O.#", "#.O..~~~...#", "#....#.#...#", "###.##.###.#", "#~~.....L..#", "#~~..F.....#", "#......~~..#", "#.###.##.###", "#...#..$...#", "#.O.#.F..O.#", "#.....~~...#", "##########A#"],
      wachen: [{ typ: "duergar", weg: [[10, 4], [8, 4], [8, 1], [10, 1]] }, { typ: "duergar", weg: [[10, 8], [1, 8], [3, 6], [10, 6]] }, { typ: "duergar", weg: [[10, 12], [1, 12]] }, { typ: "duergar", weg: [[8, 10]], blicke: ["l", "d", "r"] }, { typ: "hund", weg: [[3, 10], [1, 12]] }] },
    { n: 4, boden: "schmiede", ziel: "truhe",
      karte: ["############", "#....F.F...#", "#..........#", "#.O..===...#", "#....=K=..O#", "#..........#", "#.c......c.#", "##.##..##.##", "#....~~....#", "#.O..~~..O.#", "#..........#", "###.####.###", "#S.........A", "############"],
      wachen: [{ typ: "duergar", weg: [[1, 2], [10, 2], [10, 5], [1, 5]] }, { typ: "duergar", weg: [[4, 6]], blicke: ["r", "u", "l"] }, { typ: "duergar", weg: [[10, 10], [1, 10], [1, 8], [10, 8]] }],
      truhe: { gold: 150, pins: 5, runen: true, ziel: true }, nezna: "katze" },
    { n: 5, boden: "unterreich", ziel: "schluessel",
      karte: ["############", "#.O#.....$.#", "#S.#.c.....#", "#..#..###..#", "#........o.#", "#..#.......#", "##.####.####", "#..........#", "#.#.#.#.#.##", "#..........#", "####.##.####", "#....#....O#", "#.c..#.L...A", "############"],
      wachen: [{ typ: "drow", weg: [[10, 1], [10, 3], [4, 5], [4, 1]] }, { typ: "drow", weg: [[10, 9], [1, 9], [1, 7], [10, 7]] }, { typ: "drow", weg: [[8, 11]], blicke: ["l", "r", "u"] }, { typ: "hund", weg: [[1, 11], [4, 12]] }],
      gaeste: [{ x: 9, y: 5, dir: "u", gold: 20, typ: "drow", key: true }], nezna: "drow" },
    { n: 5, boden: "unterreich", ziel: "frei",
      karte: ["############", "#S..w....O.#", "#...ww.....#", "#.##.w##.c.#", "#..w....w..#", "#O.www.....#", "##..w.####.#", "#....w...$.#", "#.w.....ww.#", "#.##.c.##..#", "#....w.....#", "#.ww....w.O#", "#$....ww...A", "############"],
      wachen: [{ typ: "drow", weg: [[10, 5], [6, 4], [6, 1], [10, 1]] }, { typ: "drow", weg: [[10, 10], [1, 10], [1, 7], [8, 7]] }, { typ: "drow", weg: [[10, 12], [2, 12]] }] },
    { n: 5, boden: "unterreich", ziel: "schwert",
      karte: ["############", "#.c.#.X.#.c#", "#...#...#..#", "#O..##.##..#", "#..........#", "#.==....==.#", "#..........#", "#.==.L..==.#", "#..........#", "##.##..##.##", "#O...c....O#", "#..........#", "#S.........A", "############"],
      wachen: [{ typ: "drow", weg: [[10, 8], [1, 8], [1, 4], [10, 4]] }, { typ: "drow", weg: [[6, 4]], blicke: ["d", "l", "r"] }, { typ: "drow", weg: [[9, 11], [2, 11]] }, { typ: "hund", weg: [[1, 6], [10, 6]] }],
      truhe: { gold: 200, pins: 6, runen: true, ziel: true, schwert: true } }
  ];

  function spiegeln(def) {
    const sx = x => COLS - 1 - x;
    const d = JSON.parse(JSON.stringify(def));
    d.karte = def.karte.map(r => r.split("").reverse().join(""));
    (d.wachen || []).forEach(w => { w.weg = w.weg.map(([x, y]) => [sx(x), y]); if (w.blicke) w.blicke = w.blicke.map(b => SPIEGEL_DIR[b]); });
    (d.gaeste || []).forEach(g => { g.x = sx(g.x); if (g.dir) g.dir = SPIEGEL_DIR[g.dir]; });
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
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dauer + 0.05);
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
    ende: () => [392, 330, 262, 196].forEach((f, i) => ton("triangle", f, f * 0.98, 0.35, 0.12, i * 0.22))
  };

  /* ---------- Spielzustand ---------- */
  let zustand = "start"; // start | intro | spiel | wahl | pause | gefasst | erwischt | ende
  let S = null, E = null, K = null;

  function neuesSpiel() {
    const st = STUFEN[stufeWahl];
    S = {
      stufe: stufeWahl, maxLeben: st.leben, leben: st.leben, punkte: 0, aufsehen: 0,
      klau: 0, aus: 0, geist: 0, erreicht: 0, startNacht: nachtWahl, zorn: 0, zornT: 0, sterneRun: 0, neznaRun: 0,
      gaben: { umhang: 0, sohlen: 0, finger: 0, muenze: 0, klinge: 0, schritt: 0, ranken: 0, sinne: 0, lied: 0, blutdurst: 0, rast: 0 },
      texte: [], teilchen: [], wachen: [], gaeste: [], kerzen: [], lichter: []
    };
  }

  const zeichen = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS) ? "#" : K[y][x];
  const istWand = z => z === "#" || z === "A";
  function begehbar(x, y, wache) {
    const z = zeichen(x, y);
    if ("#=ocLFKXD".indexOf(z) >= 0) return false;
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
    if (idx < LEVELS.length) return LEVELS[idx];
    let r; do { r = Math.floor(Math.random() * LEVELS.length); } while (S.def && LEVELS[r] === S.def.basis && LEVELS.length > 1);
    const d = Math.random() < 0.5 ? spiegeln(LEVELS[r]) : JSON.parse(JSON.stringify(LEVELS[r]));
    d.basis = LEVELS[r]; d.basisIdx = r; d.schluesselZeigen = false;
    return d;
  }
  const endlosK = () => Math.max(0, S.lvIdx - LEVELS.length + 1);

  function stufeLaden(idx, def) {
    S.lvIdx = idx; S.def = def || levelDef(idx);
    const D = S.def, st = STUFEN[S.stufe], k = endlosK();
    K = D.karte.map(r => r.split(""));
    S.mod = { sicht: st.sicht * (1 + 0.035 * Math.min(k, 10)), tempo: st.tempo * (1 + 0.035 * Math.min(k, 10)), rate: st.rate * (1 + 0.05 * Math.min(k, 10)), schloss: st.schloss };
    S.offen = D.ziel === "frei"; S.schluessel = false; S.belegt = new Uint8Array(COLS * ROWS);
    S.lvGold = 0; S.lvGesehen = false; S.lvAus = 0; S.lvKlau = 0;
    S.schrittFrei = S.gaben.schritt > 0; S.muenzen = S.gaben.muenze; S.zielModus = false; S.muenzFlug = null;
    S.schloss = null; S.texte = []; S.teilchen = []; S.marke = null; S.zeit = 0; S.beben = 0;
    S.kerzen = []; S.lichter = []; S.gold = {}; S.robe = null; S.truhe = null; S.drache = null; S.ausgang = null;
    let start = { x: 1, y: 1 };
    const dZellen = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const z = K[y][x];
      if (z === "S") start = { x, y };
      else if (z === "c") { const kz = { x, y, an: true, r: 2.6, art: "kerze", wird: false, phase: Math.random() * 6 }; S.kerzen.push(kz); S.lichter.push(kz); }
      else if (z === "L") S.lichter.push({ x, y, an: true, r: 2.9, art: "laterne", phase: Math.random() * 6 });
      else if (z === "F") S.lichter.push({ x, y, an: true, r: 3.3, art: "feuer", phase: Math.random() * 6 });
      else if (z === "$") S.gold[x + "," + y] = 12 + Math.floor(Math.random() * 14) + (D.n - 1) * 4;
      else if (z === "R") S.robe = { x, y };
      else if (z === "K" || z === "X") {
        S.truhe = Object.assign({ x, y, offen: false, gold: 30, pins: 3 }, D.truhe || {});
        if (z === "X") S.lichter.push({ x, y, an: true, r: 1.7, art: "schwert", phase: 0 });
      }
      else if (z === "D") dZellen.push({ x, y });
      else if (z === "A") S.ausgang = { x, y };
    }
    if (dZellen.length) {
      const mx = Math.min(...dZellen.map(z => z.x)), my = Math.min(...dZellen.map(z => z.y));
      S.drache = { x: mx + 1, y: my + 1, ang: -Math.PI / 2 - 0.3, basis: -Math.PI / 2, wach: false, t: 5 + Math.random() * 2, a: 0, sweep: 0, augeT: 0 };
    }
    S.start = start;
    E = { x: start.x + 0.5, y: start.y + 0.5, ang: -Math.PI / 2, zielAng: -Math.PI / 2, pfad: [], absicht: null, versteckt: false, verkleidet: false, glut: false, repfad: 0, ruhe: 0 };
    // Gäste
    S.gaeste = (D.gaeste || []).map((g, i) => {
      const basis = g.dir ? DIRW[g.dir] : 0;
      const p = { x: g.x + 0.5, y: g.y + 0.5, ang: basis, basis, gold: g.gold || 0, key: !!g.key, typ: g.typ || "mensch", wandert: !!g.wandert, betrunken: !!g.betrunken, betet: !!g.betet, schlaeft: !!g.schlaeft,
        pfad: [], pause: 1 + Math.random() * 2, blickT: 2 + Math.random() * 4, blickAng: null, trinkT: 3 + Math.random() * 5, trinkt: 0, wachsam: 0, abgelenkt: false,
        schlafT: 6 + Math.random() * 3, wach: 0, a: 0, idx: i, farbe: GAST_FARBEN[(i * 3 + D.n) % GAST_FARBEN.length], haut: HAUT[(i * 5 + D.n) % HAUT.length], hut: (i + D.n) % 3 === 0 };
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
    S.wachen = (D.wachen || []).map(w => {
      const weg = w.weg.map(([x, y]) => ({ x, y }));
      const blicke = (w.blicke || []).map(b => DIRW[b]);
      const g = { typ: w.typ, T: WTYP[w.typ], weg, wi: weg.length > 1 ? 1 : 0, x: weg[0].x + 0.5, y: weg[0].y + 0.5, ang: 0, zielAng: 0, blicke, bi: 0,
        zustand: "patrouille", a: 0, t: 2.2, pfad: [], zuletzt: null, blind: 9, cd: 0, repfad: 0, ziel: null, sieht: false, aT: 0, dreh: Math.random() < 0.5 ? 1 : -1 };
      if (blicke.length) g.ang = blicke[0];
      else if (weg.length > 1) g.ang = Math.atan2(weg[1].y - weg[0].y, weg[1].x - weg[0].x);
      g.zielAng = g.ang;
      return g;
    });
    S.zornT = 0;
    neznaSetzen();
    hintergrundBauen();
    lichtBerechnen();
    muenzKnopfSetzen(); zornKnopfSetzen();
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
  }
  const lichtBei = (x, y) => LICHT[Math.floor(y) * COLS + Math.floor(x)] || 0;

  /* ---------- Wahrnehmung ---------- */
  function sichtRate(g) {
    if (zustand !== "spiel" || g.zustand === "aus" || g.cd > 0) return 0;
    const T = g.T, dx = E.x - g.x, dy = E.y - g.y, d = Math.hypot(dx, dy);
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
    else { const dk = T.dunkel; if (d > dk) return 0; rate = 1.05 * (1.25 - 0.7 * d / dk); }
    if (E.verkleidet && d > 1.6) rate *= 0.2;
    rate *= S.mod.rate * Math.pow(0.76, S.gaben.umhang) * (1 + S.aufsehen / 170);
    if (g.zustand === "jagd") rate *= 3;
    return Math.max(0.05, rate);
  }
  function aufsehen(n) { S.aufsehen = Math.max(0, Math.min(100, S.aufsehen + n)); }
  function laerm(qx, qy, r, zx, zy, a0) {
    S.wachen.forEach(g => {
      if (g.zustand === "aus" || g.zustand === "jagd" || g.zustand === "flucht" || !g.T.tempo) return;
      if (Math.hypot(g.x - qx, g.y - qy) > r) return;
      g.zustand = "horchen"; g.ziel = { x: zx, y: zy }; g.pfad = []; g.t = 2.6; g.a = Math.max(g.a, a0 || 0.3);
      textAuf(g.x, g.y - 0.7, "?", "#e0a046", 22, 1);
    });
    S.gaeste.forEach(p => { if (p.schlaeft && !p.wach && Math.hypot(p.x - qx, p.y - qy) <= r) { p.wach = 3; p.schlafT = 0; } });
    if (S.drache && !S.drache.wach && Math.hypot(S.drache.x - qx, S.drache.y - qy) <= r + 0.5) { S.drache.wach = true; S.drache.t = 3.5; }
  }

  /* ---------- Teilchen & Texte ---------- */
  function textAuf(x, y, text, farbe, gr, dauer) { S.texte.push({ x, y, text, farbe, gr: gr || 18, t: 0, dauer: dauer || 1.2 }); }
  function funken(x, y, farben, n, tempo) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.6 + Math.random() * 1.6) * (tempo || 1);
      S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, leben: 0.5 + Math.random() * 0.5, max: 1, farbe: zufall(farben), gr: 1.5 + Math.random() * 2.5 });
    }
  }
  function rauch(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 0.3 + Math.random() * 0.9; S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.2, leben: 0.7 + Math.random() * 0.6, max: 1.3, farbe: zufall(["rgba(40,34,46,.8)", "rgba(80,30,30,.7)", "rgba(20,16,24,.85)"]), gr: 5 + Math.random() * 7, rund: true }); } }

  /* ---------- Ezekiel ---------- */
  function absichtZiel(a) {
    if (!a) return null;
    if (a.art === "klauen" || a.art === "aus" || a.art === "freund" || a.art === "nezna") return a.ref;
    return { x: a.ref.x + 0.5, y: a.ref.y + 0.5 };
  }
  function zuAbsicht() {
    const a = E.absicht, z = absichtZiel(a); if (!z) return false;
    const zz = zelle(z), n = neben(zz), sx = Math.floor(E.x), sy = Math.floor(E.y);
    let p = null;
    if (a.art === "klauen" || a.art === "aus" || a.art === "nezna") { // möglichst von hinten anschleichen
      const grenze = a.art === "klauen" ? [1.35, 0.95, 0.55][Math.min(2, S.gaben.finger)] : a.art === "nezna" ? 1.1 : 1.3;
      p = pfadSuchen(sx, sy, (x, y) => n(x, y) && Math.abs(winkelDiff(a.ref.ang, Math.atan2(y + 0.5 - a.ref.y, x + 0.5 - a.ref.x))) > grenze, false);
    }
    if (!p) p = pfadSuchen(sx, sy, n, false);
    if (!p) return false;
    E.pfad = p; return true;
  }
  function tippen(p) {
    if (S.schloss) { schlossTippen(p); return; }
    if (p.y < OY || p.y >= FUSS_Y) return;
    const gx = p.x / C, gy = (p.y - OY) / C, zx = Math.floor(gx), zy = Math.floor(gy);
    if (S.zielModus) { werfen(gx, gy); return; }
    // Figuren zuerst
    let best = null, bd = 0.62;
    const pruef = (e, art) => { const d = Math.hypot(e.x - gx, e.y - gy); if (d < bd) { bd = d; best = { art, ref: e }; } };
    S.gaeste.forEach(g => pruef(g, "klauen"));
    S.wachen.forEach(g => { if (g.zustand !== "aus") pruef(g, "aus"); });
    if (S.nezna && !S.nezna.gefangen) pruef(S.nezna, "nezna");
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
    if (z === "~") { laerm(x + 0.5, y + 0.5, 2.7, x + 0.5, y + 0.5, 0.3); textAuf(x + 0.5, y - 0.1, t().knarr, "#a89f8f", 15, 0.9); KLANG.knarr(); }
    if (S.gold[key]) { const n = S.gold[key]; S.lvGold += n; delete S.gold[key]; textAuf(x + 0.5, y - 0.2, t().gold(n), "#e0a046", 18); funken(x + 0.5, y + 0.5, ["#e0a046", "#ffcf7a"], 8); KLANG.klau(); }
    if (S.robe && S.robe.x === x && S.robe.y === y) { S.robe = null; E.verkleidet = true; textAuf(x + 0.5, y - 0.2, t().robe, "#c4564a", 19); KLANG.klau(); }
  }
  function ezekielUpdate(dt) {
    if (S.schloss) { E.versteckt = false; return; }
    if (E.absicht) {
      const z = absichtZiel(E.absicht);
      if (!z || (E.absicht.art === "aus" && E.absicht.ref.zustand === "aus") || (E.absicht.art === "nezna" && E.absicht.ref.gefangen)) E.absicht = null;
      else if (cheb(E, z) <= 1 && Math.hypot(E.x - Math.floor(E.x) - 0.5, E.y - Math.floor(E.y) - 0.5) < 0.1 && sichtFrei(E.x, E.y, z.x, z.y)) { E.pfad = []; handeln(); }
      else if ((E.absicht.art === "klauen" && E.absicht.ref.wandert) || E.absicht.art === "aus" || E.absicht.art === "nezna") {
        E.repfad -= dt;
        if (E.repfad <= 0) { E.repfad = 0.35; if (!zuAbsicht() && !E.pfad.length) E.absicht = null; }
      } else if (!E.pfad.length && !zuAbsicht()) E.absicht = null;
    }
    const netz = zeichen(Math.floor(E.x), Math.floor(E.y)) === "w";
    const tempo = 2.7 * (1 + 0.16 * S.gaben.sohlen) * (netz ? 0.42 : 1) * (S.zornT > 0 ? 1.6 : 1);
    laufen(E, tempo, dt, betreten);
    E.versteckt = !E.pfad.length && zeichen(Math.floor(E.x), Math.floor(E.y)) === "O" && Math.hypot(E.x - Math.floor(E.x) - 0.5, E.y - Math.floor(E.y) - 0.5) < 0.05;
    drehen(E, E.zielAng, 10 * dt);
    if (netz && E.pfad.length && Math.random() < dt * 3) S.teilchen.push({ x: E.x, y: E.y, vx: (Math.random() - 0.5) * 0.4, vy: -0.2, leben: 0.6, max: 0.6, farbe: "rgba(235,226,204,.6)", gr: 1.5 });
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
  }
  function klauen(p) {
    const tx = t();
    if (p.gold <= 0 && !p.key) { textAuf(p.x, p.y - 0.7, tx.leer, "#a89f8f", 16); return; }
    const nach = Math.atan2(E.y - p.y, E.x - p.x), diff = Math.abs(winkelDiff(p.ang, nach));
    const grenze = [1.35, 0.95, 0.55][Math.min(2, S.gaben.finger)];
    const ok = p.wachsam <= 0 && (p.abgelenkt || diff > grenze || (p.schlaeft && !p.wach));
    if (ok) {
      if (p.gold > 0) { S.lvGold += p.gold; textAuf(p.x, p.y - 0.6, tx.gold(p.gold), "#e0a046", 19); funken(p.x, p.y, ["#e0a046", "#ffcf7a"], 8); KLANG.klau(); p.gold = 0; S.lvKlau++; }
      if (p.key) { p.key = false; S.schluessel = true; textAuf(p.x, p.y - 1.05, tx.schluesselDa, "#ffcf7a", 22, 1.6); KLANG.schluessel(); zielPruefen(); }
    } else {
      p.wachsam = 3.5; p.ang = nach; S.lvGesehen = true;
      textAuf(p.x, p.y - 0.7, p.schlaeft ? tx.bruell : tx.he, "#c4564a", 22); KLANG.he();
      aufsehen(12); laerm(p.x, p.y, p.schlaeft ? 7 : 5, E.x, E.y, 0.45);
      if (p.schlaeft) { KLANG.bruellen(); S.beben = 0.4; }
    }
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
    if (!S.gaben.klinge) laerm(g.x, g.y, zorn ? 4.5 : 3.3, g.x, g.y, 0.35);
    aufsehen(5);
    if (!zorn) zornPlus(S.gaben.blutdurst ? 0.75 : 0.5);
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
    S.zorn = 0; S.zornT = 6 + 2 * S.gaben.blutdurst; S.schloss = null; S.zielModus = false;
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
    if (f.name === "friedrich") { f.sprech = 2.2; f.spruch = zufall(tx.friedrich); return; }
    if (f.name === "barradin") { f.sprech = 2.2; f.spruch = zufall(tx.barradin); if (S.lied) { S.lied.an = true; S.lied.t = 10; KLANG.laute(); } }
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
    s.zone = s.ang + Math.PI * (0.7 + Math.random() * 1.1);
    s.zv = s.tr.runen ? (Math.random() < 0.5 ? -1 : 1) * (0.7 + 0.15 * s.i) : 0;
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
      laerm(s.tr.x + 0.5, s.tr.y + 0.5, 3, s.tr.x + 0.5, s.tr.y + 0.5, 0.3); aufsehen(3);
      s.i = Math.max(0, s.i - 1); neueZone();
    }
  }
  function schlossUpdate(dt) {
    const s = S.schloss; if (!s) return;
    s.ang += s.v * (1 + 0.1 * s.i) * dt;
    s.zone += s.zv * dt;
    s.blitz = Math.max(0, s.blitz - dt); s.fehl = Math.max(0, s.fehl - dt);
  }
  function truheAuf(tr) {
    S.schloss = null; tr.offen = true; KLANG.auf();
    S.lvGold += tr.gold; textAuf(tr.x + 0.5, tr.y - 0.2, t().gold(tr.gold), "#ffcf7a", 22, 1.6);
    funken(tr.x + 0.5, tr.y + 0.5, ["#e0a046", "#ffcf7a", "#ebe2cc"], 18);
    if (tr.schwert) { E.glut = true; textAuf(E.x, E.y - 1.1, t().schwertDa, "#ffcf7a", 22, 2); KLANG.schwert(); }
    if (tr.ziel) { S.zielErledigt = true; S.offen = true; textAuf(W / 2 / C, 4.2, t().wegFrei, "#ebe2cc", 24, 2); KLANG.sieg(); }
  }
  function zielPruefen() {
    if (S.def.ziel === "schluessel" && S.schluessel && !S.offen) { S.offen = true; textAuf(W / 2 / C, 4.2, t().wegFrei, "#ebe2cc", 24, 2); KLANG.sieg(); }
  }

  /* ---------- Gäste ---------- */
  function gaesteUpdate(dt) {
    const lied = S.lied && S.lied.an, bard = S.freunde.barradin;
    S.gaeste.forEach(p => {
      p.abgelenkt = false;
      if (p.wachsam > 0) { p.wachsam -= dt; drehen(p, Math.atan2(E.y - p.y, E.x - p.x), 6 * dt); return; }
      if (p.schlaeft) {
        if (p.wach > 0) {
          p.wach -= dt; p.blickT -= dt;
          if (p.blickT <= 0) { p.blickAng = p.basis + (Math.random() - 0.5) * 3.4; p.blickT = 0.9; }
          drehen(p, p.blickAng == null ? p.basis : p.blickAng, 3 * dt);
          // wacher Bugbear sieht sich um
          const d = abstand(p, E);
          if (d < 3.2 && !E.versteckt && Math.abs(winkelDiff(p.ang, Math.atan2(E.y - p.y, E.x - p.x))) < 0.8 && sichtFrei(p.x, p.y, E.x, E.y) && (lichtBei(E.x, E.y) >= 0.3 || d < 1.8)) {
            p.a += dt * 1.6;
            if (p.a >= 1) { p.a = 0; p.wachsam = 3; S.lvGesehen = true; textAuf(p.x, p.y - 0.9, t().bruell, "#c4564a", 22); KLANG.bruellen(); S.beben = 0.5; aufsehen(15); laerm(p.x, p.y, 8, E.x, E.y, 0.6); }
          } else p.a = Math.max(0, p.a - dt * 0.5);
          if (p.wach <= 0) { p.schlafT = 7 + Math.random() * 4; textAuf(p.x, p.y - 0.8, t().gaehn, "#a89f8f", 15); }
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
            const ziel = { x: 1 + Math.floor(Math.random() * (COLS - 2)), y: 1 + Math.floor(Math.random() * (ROWS - 2)) };
            if (begehbar(ziel.x, ziel.y, true)) p.pfad = (pfadSuchen(Math.floor(p.x), Math.floor(p.y), genau(ziel), true) || []).slice(0, 7);
            p.pause = 1.5 + Math.random() * 2.5;
          }
        }
      }
      if (lied && bard && abstand(p, bard) < 9) { drehen(p, Math.atan2(bard.y - p.y, bard.x - p.x), 4 * dt); p.abgelenkt = true; return; }
      // trinken
      p.trinkT -= dt;
      if (p.trinkt > 0) { p.trinkt -= dt; p.abgelenkt = true; }
      else if (p.trinkT <= 0) { p.trinkt = p.betrunken ? 2.6 : 1.6; p.trinkT = p.betrunken ? 2 + Math.random() * 3 : 4 + Math.random() * 6; }
      if (p.betet) { p.abgelenkt = Math.sin(S.zeit * 0.7 + p.idx * 2) > -0.6; }
      if (p.wandert && p.pfad.length) return;
      p.blickT -= dt;
      if (p.blickT <= 0) {
        if (p.blickAng == null) { p.blickAng = p.basis + zufall([Math.PI / 2, -Math.PI / 2, Math.PI, 0.7, -0.7]); p.blickT = 1.3 + Math.random(); }
        else { p.blickAng = null; p.blickT = (p.betet ? 5 : 2.5) + Math.random() * 4; }
      }
      drehen(p, p.blickAng == null ? p.basis : p.blickAng, (p.betrunken ? 2.5 : 4) * dt);
    });
    // Barradins Lied
    if (S.lied) {
      S.lied.t -= dt;
      if (S.lied.t <= 0) { S.lied.an = !S.lied.an; S.lied.t = S.lied.an ? 8 : 9; if (S.lied.an && bard && abstand(E, bard) < 9) KLANG.laute(); }
      if (S.lied.an && bard && Math.random() < dt * 2.5) S.teilchen.push({ x: bard.x + 0.3, y: bard.y - 0.3, vx: 0.3 + Math.random() * 0.3, vy: -0.8, leben: 1.4, max: 1.4, farbe: "#e0a046", gr: 13, note: zufall(["♪", "♫"]) });
    }
    Object.keys(S.freunde).forEach(n => { const f = S.freunde[n]; if (f.sprech > 0) f.sprech -= dt; });
  }

  /* ---------- Wachen ---------- */
  function jagdStart(g) {
    if (g.zustand === "jagd") return;
    g.zustand = "jagd"; g.repfad = 0; g.a = 1; g.pfad = []; g.blind = 0; g.zuletzt = { x: E.x, y: E.y };
    textAuf(g.x, g.y - 0.75, g.T.hund ? t().wuff : "!", "#c4564a", g.T.hund ? 22 : 28, 1.1); KLANG.entdeckt();
    if (g.T.hund) { KLANG.bellen(); laerm(g.x, g.y, 6, E.x, E.y, 0.6); }
    S.lvGesehen = true; aufsehen(15);
    S.schloss = null;
  }
  function wirtRuft(g) {
    g.a = 0; g.cd = 6; S.lvGesehen = true;
    textAuf(g.x, g.y - 0.8, t().wache, "#c4564a", 22, 1.4); KLANG.he();
    aufsehen(10); laerm(g.x, g.y, 11, E.x, E.y, 0.6);
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
  function wacheUpdate(g, dt) {
    if (g.zustand === "aus") { g.aT += dt; return; }
    const T = g.T, rate = sichtRate(g);
    g.sieht = rate > 0;
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
          g.t -= dt; if (g.t <= 0) { g.bi = (g.bi + 1) % g.blicke.length; g.t = 2.3 + Math.random() * 1.2; }
          drehen(g, g.blicke[g.bi], 2.4 * dt);
        } else {
          if (!g.pfad.length) {
            const z = g.weg[g.wi];
            if (aufZelle(g, z)) { g.wi = (g.wi + 1) % g.weg.length; g.zustand = "umsehen"; g.t = 0.7 + Math.random() * 0.7; g.umAng = g.ang; break; }
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
          const z = g.sieht ? E : g.zuletzt;
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
      if (d.a >= 1) { textAuf(d.x, d.y - 1.4, t().drache, "#c4564a", 22, 1.6); KLANG.bruellen(); S.beben = 0.7; d.a = 0; gefasst(null); return; }
      if (d.t <= 0) { d.wach = false; d.t = 6.5 + Math.random() * 2.5; d.a = 0; }
    } else {
      d.sieht = false; d.ang += winkelDiff(d.ang, d.basis) * Math.min(1, dt * 2);
      if (d.t <= 0) { d.wach = true; d.t = 3.6; d.sweep = Math.random() * 6; }
    }
  }

  /* ---------- Nezna ---------- */
  const NEZNA_LEVELS = LEVELS.map((l, i) => l.nezna ? i : -1).filter(i => i >= 0);
  function neznaSetzen() {
    S.nezna = null;
    const art = S.def.nezna || (endlosK() && Math.random() < 0.3 ? "katze" : null);
    if (!art) return;
    const kand = [];
    pfadSuchen(S.start.x, S.start.y, (x, y) => { if (Math.hypot(x - S.start.x, y - S.start.y) >= 6 && zeichen(x, y) !== "~") kand.push({ x, y }); return false; }, true);
    if (!kand.length) return;
    const z = zufall(kand);
    S.nezna = { x: z.x + 0.5, y: z.y + 0.5, ang: Math.random() * 6, zielAng: 0, pfad: [], form: art, pause: 1, a: 0, cd: 0, flucht: 0, gefangen: false, sieht: false };
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
        const ziel = { x: 1 + Math.floor(Math.random() * (COLS - 2)), y: 1 + Math.floor(Math.random() * (ROWS - 2)) };
        if (begehbar(ziel.x, ziel.y, true)) n.pfad = (pfadSuchen(Math.floor(n.x), Math.floor(n.y), genau(ziel), true) || []).slice(0, 6);
        n.pause = 1.2 + Math.random() * 2.5;
      }
      if (Math.random() < dt * 0.6) n.zielAng = n.ang + (Math.random() - 0.5) * 3;
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
    n.gefangen = true; S.lvGold += gold; S.neznaRun++;
    rauch(n.x, n.y, 12); funken(n.x, n.y, ["#b48ad8", "#e0a046"], 12);
    textAuf(n.x, n.y - 0.7, tx.entlarvt, "#b48ad8", 21, 1.8); textAuf(n.x, n.y - 0.2, tx.gold(gold), "#e0a046", 18, 1.6);
    if (n.form === "drow") textAuf(n.x, n.y - 1.3, tx.spinne, "#ebe2cc", 15, 3);
    KLANG.schluessel();
    if (S.lvIdx < LEVELS.length) schreib("imres-diebesnacht-nezna", String(neznaLesen() | (1 << S.lvIdx)));
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
    S.schloss = null; E.absicht = null; E.pfad = [];
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
  function stufeGeschafft() {
    if (zustand !== "spiel") return;
    zustand = "wahl"; KLANG.sieg();
    const bonus = S.lvGesehen ? 0 : 40 + 10 * Math.min(5, Math.floor(S.lvIdx / 3));
    S.lvBonus = bonus;
    const st = sterneJetzt();
    S.lvSterne = st; S.lvGoldBonus = st & 2 ? 25 + 5 * S.def.n : 0; S.lvBlutBonus = st & 4 ? 20 : 0;
    S.sterneRun += bits(st);
    if (S.lvIdx < LEVELS.length) {
      const alle = sterneLesen(), alt = alle[S.lvIdx] || 0;
      S.lvSterneNeu = st & ~alt; alle[S.lvIdx] = alt | st;
      try { localStorage.setItem("imres-diebesnacht-sterne", JSON.stringify(alle)); } catch (_) {}
    } else S.lvSterneNeu = 0;
    S.punkte += S.lvGold + bonus + S.lvGoldBonus + S.lvBlutBonus;
    S.klau += S.lvKlau; S.aus += S.lvAus; if (!S.lvGesehen) S.geist++;
    S.erreicht = S.lvIdx + 1;
    S.nachtEnde = (S.lvIdx + 1) % 3 === 0;
    if (S.nachtEnde) S.aufsehen = 0; else aufsehen(-8);
    const naechste = S.lvIdx + 1;
    if (naechste < LEVELS.length && naechste % 3 === 0) {
      const n = naechste / 3 + 1;
      if (n > freiNaechte()) schreib("imres-diebesnacht-nacht", String(n));
    }
    gabenZeigen();
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
    if (S.zornT > 0) {
      S.zornT -= dt;
      if (Math.random() < dt * 22) S.teilchen.push({ x: E.x + (Math.random() - 0.5) * 0.6, y: E.y + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 0.4, vy: -0.7, leben: 0.6, max: 0.6, farbe: zufall(["#c4564a", "#ff6a3a", "#e0a046"]), gr: 2.2 });
      if (S.zornT <= 0) S.zornT = 0;
      if (Math.floor(S.zornT * 4) !== S.zornAlt) { S.zornAlt = Math.floor(S.zornT * 4); zornKnopfSetzen(); }
    }
    schlossUpdate(dt);
    if (S.muenzFlug) {
      const m = S.muenzFlug; m.t += dt / 0.55;
      if (m.t >= 1) { S.muenzFlug = null; KLANG.klirr(); textAuf(m.x1, m.y1 - 0.4, t().klirr, "#e0a046", 17, 0.9); funken(m.x1, m.y1, ["#e0a046", "#ffcf7a"], 6, 0.6); laerm(m.x1, m.y1, 3.9, m.x1, m.y1, 0.3); }
    }
    nebenbei(dt);
  }
  function nebenbei(dt) {
    S.teilchen.forEach(q => { q.leben -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; });
    S.teilchen = S.teilchen.filter(q => q.leben > 0);
    S.texte.forEach(x => { x.t += dt; x.y -= dt * 0.45; });
    S.texte = S.texte.filter(x => x.t < x.dauer);
    if (S.marke) { S.marke.t += dt; if (S.marke.t > 0.6) S.marke = null; }
    S.beben = Math.max(0, S.beben - dt * 1.4);
  }

  /* ---------- Zeichnen ---------- */
  const leinwand = document.createElement("canvas");
  const ctx = leinwand.getContext("2d");
  const dunkelTex = document.createElement("canvas"); dunkelTex.width = COLS; dunkelTex.height = ROWS;
  const dctx = dunkelTex.getContext("2d");
  const dunkelBild = dctx.createImageData(COLS, ROWS);
  let skala = 1, hgBild = null, rexBild = null, startBild = null;
  const THEMEN = {
    holz:       { boden: "#33241a", fuge: "#22180f", hell: "rgba(224,160,70,.05)", wand: "#1f1b19", wandOben: "#3a312a", stein: false },
    stein:      { boden: "#29272c", fuge: "#1b1a1e", hell: "rgba(235,226,204,.04)", wand: "#18171b", wandOben: "#35323a", stein: true },
    fels:       { boden: "#2a2420", fuge: "#1b1714", hell: "rgba(168,159,143,.05)", wand: "#16120f", wandOben: "#302823", stein: true, fels: true },
    schmiede:   { boden: "#2b2320", fuge: "#1a1411", hell: "rgba(224,120,60,.06)", wand: "#1a1412", wandOben: "#3a2a22", stein: true },
    unterreich: { boden: "#1f1d27", fuge: "#141219", hell: "rgba(140,120,200,.05)", wand: "#121019", wandOben: "#2a2536", stein: true, pilze: true }
  };
  function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function hintergrundBauen() {
    const f = 2, c = document.createElement("canvas"); c.width = W * f; c.height = Math.ceil(GH * f);
    const x = c.getContext("2d"); x.scale(f, f);
    const th = THEMEN[S.def.boden] || THEMEN.stein, r = lcg(11 + S.lvIdx * 7);
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
        if (S.def.boden === "schmiede" && r() < 0.06) { x.strokeStyle = "rgba(224,120,60,.3)"; x.beginPath(); x.moveTo(px + r() * C, py + r() * C); x.lineTo(px + r() * C, py + r() * C); x.stroke(); }
      }
    }
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
          x.fillStyle = "#b9a88a"; x.beginPath(); x.arc(px + C * 0.38, py + C * 0.42, 3.2, 0, 7); x.fill();
          x.fillStyle = "#d8c7a0"; x.beginPath(); x.arc(px + C * 0.62, py + C * 0.58, 2.6, 0, 7); x.fill();
          if (r() < 0.6) { x.fillStyle = "#e0a046"; x.fillRect(px + C * 0.55, py + C * 0.3, 3, 3); }
        }
      } else if (z === "=") {
        const holz = !th.stein || S.def.n === 4 && S.def.ziel !== "truhe";
        const l = zeichen(xx - 1, y) === "=" || zeichen(xx - 1, y) === "K", rr = zeichen(xx + 1, y) === "=" || zeichen(xx + 1, y) === "K", o = zeichen(xx, y - 1) === "=", u = zeichen(xx, y + 1) === "=";
        const x0 = px + (l ? 0 : 3), x1 = px + C - (rr ? 0 : 3), y0 = py + (o ? 0 : 3), y1 = py + C - (u ? 0 : 3);
        x.fillStyle = holz ? "#4a321f" : "#3d3a40"; x.fillRect(x0, y0, x1 - x0, y1 - y0);
        x.fillStyle = holz ? "#6a4a2e" : "#57525a"; x.fillRect(x0, y0, x1 - x0, 3);
        if (!holz && S.def.n === 5) { x.strokeStyle = "rgba(0,0,0,.4)"; x.strokeRect(x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6); }
        if (holz && r() < 0.5) { x.fillStyle = "#c9b28a"; x.beginPath(); x.arc(px + C / 2, py + C / 2, 3, 0, 7); x.fill(); }
      } else if (z === "O") {
        const cx = px + C / 2, cy = py + C / 2;
        x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.arc(cx + 2, cy + 3, C * 0.38, 0, 7); x.fill();
        x.fillStyle = "#4e3520"; x.beginPath(); x.arc(cx, cy, C * 0.38, 0, 7); x.fill();
        x.strokeStyle = "#2a1c10"; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, C * 0.38, 0, 7); x.stroke();
        x.strokeStyle = "#7a6a58"; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, C * 0.29, 0, 7); x.stroke();
        x.fillStyle = "#3a2716"; x.beginPath(); x.arc(cx, cy, C * 0.22, 0, 7); x.fill();
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
      } else if (z === "D") {
        x.fillStyle = "rgba(224,160,70,.12)"; x.fillRect(px, py, C, C);
        for (let k = 0; k < 6; k++) { x.fillStyle = r() < 0.5 ? "#c98a3a" : "#e0a046"; x.beginPath(); x.arc(px + r() * C, py + r() * C, 2 + r() * 2, 0, 7); x.fill(); }
      }
    }
    hgBild = c;
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
        if (q.an) flamme(px, py - 12, 3.2, q.phase);
        else if (Math.random() < 0.02) S.teilchen.push({ x: q.x + 0.5, y: q.y + 0.2, vx: 0, vy: -0.3, leben: 0.9, max: 0.9, farbe: "rgba(168,159,143,.35)", gr: 3, rund: true });
      } else if (q.art === "laterne") flamme(px, py + 1, 3.6, q.phase);
      else if (q.art === "feuer") { flamme(px - 5, py + 2, 5, q.phase, "#e0a046"); flamme(px + 5, py + 3, 4.5, q.phase + 2, "#e0a046"); flamme(px, py, 6.5, q.phase + 1); }
    });
    // warmer Schein über der Dunkelheit
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    S.lichter.forEach(q => {
      if (!q.an || q.art === "schwert") return;
      const px = PX(q.x + 0.5), py = PY(q.y + 0.5), rr = q.r * C * 0.55;
      const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, "rgba(224,140,60,.16)"); g.addColorStop(1, "rgba(224,140,60,0)");
      ctx.fillStyle = g; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    });
    if (E.glut) { const px = PX(E.x), py = PY(E.y), rr = 2.5 * C * 0.7, g = ctx.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, "rgba(255,210,120,.3)"); g.addColorStop(1, "rgba(255,210,120,0)"); ctx.fillStyle = g; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
    ctx.restore();
  }

  function dunkelZeichnen() {
    const d = dunkelBild.data;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      let l = LICHT[i];
      if (istWand(K[y][x])) { l = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS && !istWand(K[yy][xx])) l = Math.max(l, LICHT[yy * COLS + xx] * 0.75); }); }
      const a = 0.74 * Math.pow(1 - l, 1.25);
      d[i * 4] = 7; d[i * 4 + 1] = 6; d[i * 4 + 2] = 14; d[i * 4 + 3] = Math.round(a * 255);
    }
    dctx.putImageData(dunkelBild, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(dunkelTex, 0, 0, COLS, ROWS, 0, OY, W, GH);
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
    if (d && d.wach) { const k = dracheKopf(); kegelZeichnen(k.x, k.y, d.ang, 0.62, 5.6 * S.mod.sicht, d.a > 0.3 ? "rgba(196,86,74,A)" : "rgba(160,200,90,A)"); }
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
    g.addColorStop(0, E.verkleidet ? "#a3231c" : "#6b1c16"); g.addColorStop(1, E.verkleidet ? "#6a1410" : "#2e0d0a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.8, r * 1.02, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#2a1a16"; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(0, s * r * 0.55); ctx.lineTo(-r * 0.25, s * r * 1.05); ctx.lineTo(r * 0.25, s * r * 0.85); ctx.closePath(); ctx.fill(); });
    // Kapuze
    ctx.fillStyle = E.verkleidet ? "#b8302a" : "#7a2018"; ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.5, 0, 7); ctx.fill();
    // Hörner
    ctx.strokeStyle = "#1a1210"; ctx.lineWidth = 3; ctx.lineCap = "round";
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.0, s * r * 0.35); ctx.quadraticCurveTo(-r * 0.35, s * r * 0.95, r * 0.25, s * r * 0.95); ctx.stroke(); });
    ctx.strokeStyle = "#4a3a32"; ctx.lineWidth = 1; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(r * 0.0, s * r * 0.35); ctx.quadraticCurveTo(-r * 0.35, s * r * 0.95, r * 0.25, s * r * 0.95); ctx.stroke(); });
    ctx.restore();
  }
  function ezekielAugen() {
    const px = PX(E.x), py = PY(E.y), r = C * 0.36;
    if (S.zornT > 0) {
      const p = 0.75 + 0.25 * Math.sin(S.zeit * 12), rr = C * (0.75 + 0.1 * p);
      const g = ctx.createRadialGradient(px, py, r * 0.6, px, py, rr);
      g.addColorStop(0, "rgba(196,40,30,0)"); g.addColorStop(0.6, "rgba(196,40,30," + (0.35 * p).toFixed(2) + ")"); g.addColorStop(1, "rgba(196,40,30,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rr, 0, 7); ctx.fill();
    }
    ctx.save(); ctx.translate(px, py); ctx.rotate(E.ang);
    ctx.fillStyle = "#ff6a3a"; ctx.shadowColor = "#ff3a1a"; ctx.shadowBlur = 8;
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(r * 0.45, s * r * 0.17, 1.7, 0, 7); ctx.fill(); });
    ctx.restore();
    // dezenter Ring, damit man ihn im Dunkeln findet
    ctx.strokeStyle = E.versteckt ? "rgba(168,159,143,.45)" : "rgba(196,86,74,.4)"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(px, py, C * 0.52, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  function wacheZeichnen(g) {
    const T = g.T, px = PX(g.x), py = PY(g.y), r = C * T.r;
    if (T.hund) { hundZeichnen(g, px, py, r); return; }
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
    if (T.fackel) { ctx.strokeStyle = "#5a4430"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(r * 0.2, r * 0.7); ctx.lineTo(r * 1.15, r * 0.55); ctx.stroke(); }
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
    ctx.restore();
    if (T.fackel) flamme(px + Math.cos(g.ang) * r * 1.15 + Math.cos(g.ang + 1.57) * r * 0.55, py + Math.sin(g.ang) * r * 1.15 + Math.sin(g.ang + 1.57) * r * 0.55, 3.4, g.x * 3);
  }
  function hundZeichnen(g, px, py, r) {
    const T = g.T, zahm = g.zahm, lauf = (g.pfad && g.pfad.length) ? Math.sin(S.zeit * 16) * 0.25 : 0;
    const farbe = S.def.n >= 5 ? "#6a6070" : S.def.n === 3 ? "#7e7a72" : T.mantel, kopf = S.def.n >= 5 ? "#7e7488" : S.def.n === 3 ? "#949088" : T.kopf;
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
    S.gaeste.forEach(p => {
      const px = PX(p.x), py = PY(p.y);
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
  function dracheZeichnen() {
    const d = S.drache; if (!d) return;
    const px = PX(d.x), py = PY(d.y), atem = 1 + Math.sin(S.zeit * (d.wach ? 3 : 1.2)) * 0.03;
    ctx.save(); ctx.translate(px, py);
    ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(3, 5, C * 1.05, C * 0.85, 0, 0, 7); ctx.fill();
    // Schwanz
    ctx.strokeStyle = "#3f5a2e"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-C * 0.3, C * 0.5); ctx.quadraticCurveTo(-C * 1.2, C * 0.9, -C * 0.9, C * 0.1); ctx.stroke();
    ctx.scale(atem, atem);
    // Flügel
    ctx.fillStyle = "#2f4524";
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * C * 0.95, -C * 0.35); ctx.lineTo(s * C * 0.85, C * 0.35); ctx.lineTo(s * C * 0.4, C * 0.55); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = "#4f6e38"; ctx.beginPath(); ctx.ellipse(0, C * 0.1, C * 0.55, C * 0.68, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#6f8a4a"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-4, C * (0.55 - i * 0.24)); ctx.lineTo(0, C * (0.45 - i * 0.24)); ctx.lineTo(4, C * (0.55 - i * 0.24)); ctx.fill(); }
    ctx.restore();
    // Kopf
    const k = dracheKopf(), kx = PX(k.x), ky = PY(k.y);
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(d.ang);
    ctx.fillStyle = "#4f6e38"; ctx.beginPath(); ctx.moveTo(C * 0.45, 0); ctx.lineTo(-C * 0.2, -C * 0.28); ctx.lineTo(-C * 0.3, C * 0.28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#2a3a1c"; ctx.lineWidth = 2.5; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(-C * 0.15, s * C * 0.18); ctx.lineTo(-C * 0.42, s * C * 0.34); ctx.stroke(); });
    ctx.fillStyle = d.wach ? "#ffcf3a" : "#1a2412"; if (d.wach) { ctx.shadowColor = "#ffcf3a"; ctx.shadowBlur = 8; }
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(C * 0.08, s * C * 0.12, d.wach ? 2.6 : 2.4, d.wach ? 2 : 0.7, 0, 0, 7); ctx.fill(); });
    ctx.restore();
  }
  function dracheZzz() {
    const d = S.drache; if (!d || d.wach) return;
    ctx.font = "600 18px " + FONT_H; ctx.fillStyle = "rgba(160,200,90,.8)"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
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

  function hudZeichnen() {
    const tx = t();
    ctx.fillStyle = "rgba(9,8,15,.82)"; ctx.fillRect(0, 0, W, OY);
    ctx.textBaseline = "top"; ctx.font = "14px " + FONT_D; ctx.fillStyle = "#a89f8f"; ctx.textAlign = "left";
    const k = endlosK();
    ctx.fillText(k ? tx.kurzEndlos(k) : tx.kurz(S.def.n, S.lvIdx % 3 + 1), 9, 8);
    const lw = ctx.measureText(k ? tx.kurzEndlos(k) : tx.kurz(S.def.n, S.lvIdx % 3 + 1)).width, st = sterneJetzt();
    [1, 2, 4].forEach((b, i) => {
      const sx = 9 + lw + 12 + i * 14, ok = st & b;
      sternPfad(sx, 15, 5.2);
      if (ok) { ctx.fillStyle = "#e0a046"; ctx.fill(); }
      else if (b === 2) { ctx.strokeStyle = "rgba(224,160,70,.6)"; ctx.lineWidth = 1; ctx.stroke(); }
      else { ctx.fillStyle = "rgba(168,159,143,.25)"; ctx.fill(); }
    });
    ctx.textAlign = "center"; ctx.fillStyle = "#e0a046"; ctx.font = "21px " + FONT_D;
    ctx.fillText(String(S.punkte + S.lvGold), W / 2 + 8, 4);
    const tw = ctx.measureText(String(S.punkte + S.lvGold)).width;
    ctx.fillStyle = "#e0a046"; ctx.beginPath(); ctx.arc(W / 2 - tw / 2 - 4, 15, 5, 0, 7); ctx.fill(); ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = "right"; ctx.font = (S.maxLeben > 4 ? 13 : 16) + "px " + FONT_D;
    let hs = ""; for (let i = 0; i < S.maxLeben; i++) hs += i < S.leben ? "♥" : "♡";
    ctx.fillStyle = S.leben <= 1 ? "#c4564a" : "#e0a046"; ctx.fillText(hs, W - 9, 8);
    // Aufsehen
    const bx = 22, bw = W - 31, by = 31;
    ctx.font = "10px sans-serif"; ctx.textAlign = "left"; ctx.globalAlpha = 0.75; ctx.fillText("👁", 7, by - 3); ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(235,226,204,.08)"; ctx.fillRect(bx, by, bw, 4);
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, "#9b3a2f"); g.addColorStop(1, "#e0563a");
    ctx.fillStyle = g; ctx.fillRect(bx, by, bw * S.aufsehen / 100, 4);
    // Fußleiste
    ctx.fillStyle = "rgba(9,8,15,.82)"; ctx.fillRect(0, FUSS_Y, W, H - FUSS_Y);
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const zielTxt = S.offen && S.def.ziel !== "frei" ? tx.ziel.ausgang : tx.zielWort + tx.ziel[S.def.ziel];
    ctx.font = "600 17px " + FONT_H; ctx.fillStyle = S.offen && S.def.ziel !== "frei" ? "#e0a046" : "#ebe2cc";
    ctx.fillText(zielTxt, 9, FUSS_Y + 16, W - 120);
    const gb = Object.keys(S.gaben).filter(k2 => k2 !== "rast" && S.gaben[k2] > 0);
    ctx.font = "12px sans-serif"; ctx.globalAlpha = 0.8;
    gb.forEach((k2, i) => ctx.fillText(GABE_SYM[k2] + (S.gaben[k2] > 1 ? S.gaben[k2] : ""), 9 + i * 26, FUSS_Y + 37));
    ctx.globalAlpha = 1;
    if (S.zielModus) { ctx.font = "600 16px " + FONT_H; ctx.fillStyle = "#ffcf7a"; ctx.textAlign = "center"; ctx.fillText(t().zielen, W / 2, OY + 14); }
  }

  function zeichnen() {
    if (!hgBild || !S || !S.def) { ctx.setTransform(skala, 0, 0, skala, 0, 0); ctx.fillStyle = "#0b0a12"; ctx.fillRect(0, 0, W, H); if (startBild) startZeichnen(); return; }
    ctx.setTransform(skala, 0, 0, skala, 0, 0);
    ctx.fillStyle = "#0b0a12"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (S.beben > 0 && !ruhig) ctx.translate((Math.random() - 0.5) * 7 * S.beben, (Math.random() - 0.5) * 7 * S.beben);
    ctx.drawImage(hgBild, 0, OY, W, GH);
    objekteZeichnen();
    // Figuren nach Tiefe
    const figs = [];
    S.gaeste.forEach(p => figs.push([p.y, () => gastZeichnen(p)]));
    S.wachen.forEach(g => figs.push([g.zustand === "aus" ? -1 : g.y, () => wacheZeichnen(g)]));
    figs.push([E.y, ezekielZeichnen]);
    if (S.drache) figs.push([S.drache.y, dracheZeichnen]);
    if (S.nezna && !S.nezna.gefangen) figs.push([S.nezna.y, neznaZeichnen]);
    figs.sort((a, b) => a[0] - b[0]).forEach(f => f[1]());
    dunkelZeichnen();
    freundeZeichnen();
    lichterZeichnen();
    kegelAlle();
    if (S.marke) {
      const a = 1 - S.marke.t / 0.6, mx = PX(S.marke.x), my = PY(S.marke.y);
      ctx.strokeStyle = (S.marke.nein ? "rgba(168,159,143," : "rgba(224,160,70,") + a.toFixed(2) + ")"; ctx.lineWidth = 1.5;
      if (S.marke.nein) { const k = C * 0.2; ctx.beginPath(); ctx.moveTo(mx - k, my - k); ctx.lineTo(mx + k, my + k); ctx.moveTo(mx + k, my - k); ctx.lineTo(mx - k, my + k); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(mx, my, C * (0.2 + S.marke.t * 0.4), 0, 7); ctx.stroke(); }
    }
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
    schlossZeichnen();
    ctx.restore();
    hudZeichnen();
  }
  function startZeichnen() {
    // Titelbild hinter dem Startschleier: Ezekiels Porträt, abgedunkelt
    const b = startBild, f = Math.max(W / b.width, H / b.height), w = b.width * f, h = b.height * f;
    ctx.globalAlpha = 0.55; ctx.drawImage(b, (W - w) / 2, (H - h) / 2 - 20, w, h); ctx.globalAlpha = 1;
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
    } else if (S && S.def && zustand !== "pause") { S.zeit += dt; nebenbei(dt); }
    zeichnen();
    if (sichtbar && !document.hidden && zustand !== "pause" && zustand !== "start") rafId = requestAnimationFrame(schleife);
  }
  function anwerfen() { if (!rafId && sichtbar && !document.hidden) { letzte = 0; rafId = requestAnimationFrame(schleife); } }

  /* ---------- DOM & Overlays ---------- */
  let buehne, schleier, tafel, fussRekord, tonKnopf, pauseKnopf, muenzKnopf, zornKnopf, listeEl;
  const rekordKey = st => "imres-diebesnacht-rekord-" + st;
  const aktuelleStufe = () => (S && zustand !== "start" ? S.stufe : stufeWahl);

  function aufbauen() {
    const tx = t();
    root.innerHTML =
      '<p class="label" id="dn-label">' + esc(tx.label) + '</p>' +
      '<h3 id="dn-titel">' + esc(tx.titel) + '</h3>' +
      '<p class="tav-info" id="dn-text">' + esc(tx.text) + '</p>' +
      '<p class="dn-steuerung" id="dn-steuerung">' + esc(tx.steuerung) + '</p>' +
      '<div class="dn-buehne"><div class="dn-knoepfe"><button type="button" class="dn-zorn" hidden><span aria-hidden="true">😈</span></button><button type="button" class="dn-muenze" hidden><span>0</span></button><button type="button" class="dn-pause" aria-label="Pause"><span aria-hidden="true">❚❚</span></button></div><div class="dn-schleier"><div class="dn-tafel"></div></div></div>' +
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
    else if (zustand === "wahl") gabenZeigen(true);
    else if (zustand === "erwischt") erwischtZeigen(true);
    else if (zustand === "ende") spielEnde(true);
  }
  function schleierAuf(html) { tafel.innerHTML = html; schleier.hidden = false; buehne.classList.remove("laeuft"); }
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
    schleierAuf('<h4>' + esc(tx.titel) + '</h4>' + stufenHtml(tx) +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="start">' + esc(tx.start) + '</button>');
  }
  function introZeigen() {
    const tx = t(), k = endlosK(), idx = k ? S.def.basisIdx : S.lvIdx, [titel, tipp] = tx.lv[idx], nacht = tx.naechte[S.def.n - 1];
    schleierAuf(
      '<p class="dn-nacht">' + esc(k ? tx.endlos(k) : tx.nacht(S.def.n) + " · " + nacht[0]) + '</p>' +
      '<h4>' + esc(titel) + '</h4>' +
      '<p class="dn-ort">' + esc(k ? tx.endlosUnter : nacht[1] + " · " + tx.stufe(S.lvIdx % 3 + 1, 3)) + '</p>' +
      '<p class="dn-tipp">' + esc(tipp) + '</p>' +
      (S.wachen.some(g => g.T.hund) ? '<p class="dn-extra">' + esc(tx.hundHinweis) + '</p>' : "") +
      (S.nezna ? '<p class="dn-extra">' + esc(S.nezna.form === "drow" ? tx.neznaDrow : tx.neznaHinweis) + '</p>' : "") +
      '<p class="dn-zielzeile">' + esc(tx.zielWort + tx.ziel[S.def.ziel]) + '</p>' +
      (!k ? sterneHtml(tx, sterneLesen()[S.lvIdx] || 0, 0) : "") +
      '<button type="button" class="tav-knopf dn-haupt" data-tun="los">' + esc(tx.los) + '</button>');
  }
  function pauseZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.pause) + '</h4><p>' + esc(tx.pauseText) + '</p><button type="button" class="tav-knopf dn-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>' +
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
      const rastRein = moegl.includes("rast") && (S.leben <= 1 || Math.random() < 0.35);
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
      (S.lvGoldBonus || S.lvBlutBonus ? '<br>' + esc(tx.sterneBonus(S.lvGoldBonus, S.lvBlutBonus)) : "") + '</p>' +
      (nachtTxt ? '<p class="dn-spruch">' + esc(nachtTxt) + '</p>' : "") +
      '<p>' + esc(tx.rastText) + '</p>' +
      '<div class="dn-gaben">' + karten + '</div>' +
      '<button type="button" class="dn-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>');
  }

  function spielEnde(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "ende";
      KLANG.ende();
      const alt = parseInt(lies(rekordKey(S.stufe), "0"), 10);
      S.neuerRekord = S.punkte > alt && S.punkte > 0;
      if (S.neuerRekord) schreib(rekordKey(S.stufe), String(S.punkte));
      S.altRekord = alt;
      const e = S.erreicht;
      S.spruchStufe = e >= LEVELS.length ? "legende" : e >= 6 ? "gut" : e >= 3 ? "mittel" : "schwach";
      S.spruchIdx = Math.floor(Math.random() * 3);
      S.eingetragen = ""; S.sendet = false;
    }
    const spruch = tx.spruch[S.spruchStufe][S.spruchIdx];
    schleierAuf(
      '<h4>' + esc(S.leben > 0 ? tx.titel : tx.ende) + '</h4>' +
      '<p class="dn-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + ' · ' + esc(tx.stufen[S.stufe]) + '</span></p>' +
      (S.neuerRekord && S.altRekord ? '<p class="dn-neu">' + esc(tx.neuRekord) + '</p>' : "") +
      '<dl class="dn-werte">' +
      '<dt>' + esc(tx.wert.stufe) + '</dt><dd>' + esc(stufeName(S.lvIdx)) + '</dd>' +
      '<dt>' + esc(tx.wert.bestohlen) + '</dt><dd>' + S.klau + '</dd>' +
      '<dt>' + esc(tx.wert.aus) + '</dt><dd>' + S.aus + '</dd>' +
      '<dt>' + esc(tx.wert.geist) + '</dt><dd>' + S.geist + '</dd>' +
      '<dt>★</dt><dd>' + S.sterneRun + '</dd>' +
      (S.neznaRun ? '<dt>🐈‍⬛</dt><dd>' + S.neznaRun + '</dd>' : "") +
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
    audio();
    if (tun === "start") { neuesSpiel(); stufeLaden((nachtWahl - 1) * 3); zustand = "intro"; introZeigen(); fussSetzen(); listeNeu(); anwerfen(); }
    else if (tun === "los") { zustand = "spiel"; schleierZu(); muenzKnopfSetzen(); anwerfen(); }
    else if (tun === "erneut") { stufeLaden(S.lvIdx, S.def); zustand = "spiel"; schleierZu(); anwerfen(); }
    else if (tun === "neu") { zustand = "start"; S = null; startZeigen(); fussSetzen(); bestenLaden(stufeWahl); zeichnen(); }
    else if (tun === "weiter") { zustand = "spiel"; schleierZu(); anwerfen(); }
    else if (tun === "beenden") { if (zustand === "wahl" || zustand === "erwischt") { /* Beute dieser Stufe zählt nicht */ } spielEnde(); }
  }

  function pausieren() {
    if (zustand !== "spiel") return;
    zustand = "pause"; S.zielModus = false; muenzKnopfSetzen();
    pauseZeigen();
  }
  document.addEventListener("keydown", e => {
    if (zustand !== "spiel" || !sichtbar) return;
    if (e.key === "Escape" || e.key === "p" || e.key === "P") { e.preventDefault(); if (S.schloss) S.schloss = null; else pausieren(); }
    if (e.key === " " && S.schloss) { e.preventDefault(); const m = schlossMitte(); schlossTippen({ x: m.x, y: m.y }); }
  });

  /* ---------- Bestenliste: gemeinsam über Supabase (wie bei Friedrichs Jagd), sonst auf diesem Gerät ---------- */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    return fetch(SERVER.url + pfad, body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) })
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status));
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
  function listeNeu() {
    if (!listeEl) return;
    const T = t(), st = aktuelleStufe(), l = besten[st];
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
    const name = lies("imres-diebesnacht-name", "") || lies("imres-waldlauf-name", "") || lies("imres-auftritt-name", "");
    return '<div class="dn-eintrag"><input type="text" class="dn-name" maxlength="24" autocomplete="nickname" placeholder="' + esc(T.deinName) + '" value="' + esc(name) + '">' +
      '<button type="button" class="tav-knopf dn-eintragen"' + (S.sendet ? " disabled" : "") + ">" + esc(T.eintragen) + "</button></div>";
  }
  function eintragen() {
    if (!S || zustand !== "ende" || S.eingetragen || S.sendet) return;
    const feld = tafel.querySelector(".dn-name"), name = feld ? feld.value.trim().slice(0, 24) : "";
    if (!name) { if (feld) feld.focus(); return; }
    schreib("imres-diebesnacht-name", name);
    const T = t(), st = S.stufe, spiel = S;
    const e = { name, punkte: S.punkte, level: S.lvIdx + 1, erstellt: new Date().toISOString() };
    const lok = lokalLesen(); lok[st] = sortieren((lok[st] || []).concat([e])).slice(0, 10);
    schreib("imres-diebesnacht-liste", JSON.stringify(lok));
    spiel.sendet = true;
    server("/rest/v1/rpc/diebe_eintragen", { p_name: name, p_stufe: st, p_punkte: e.punkte, p_level: e.level })
      .catch(() => {}).then(() => bestenLaden(st)).then(() => {
        spiel.sendet = false;
        const l = besten[st] || [];
        const platz = l.findIndex(x => x.name === name && x.punkte === e.punkte && x.level === e.level) + 1;
        if (platz) meinEintrag = l[platz - 1].erstellt;
        spiel.eingetragen = platz ? T.eingetragen(platz) : T.eingetragenOhne;
        if (S === spiel && zustand === "ende") spielEnde(true); else listeNeu();
      });
  }

  /* ---------- Eingabe ---------- */
  function punkt(ev) {
    const r = leinwand.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
  }
  const druecke = new Map();
  leinwand.addEventListener("pointerdown", ev => {
    if (zustand !== "spiel") return;
    ev.preventDefault();
    druecke.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, t: performance.now() });
    audio();
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
    skala = leinwand.width / W;
    zeichnen();
  }

  /* ---------- Stil ---------- */
  const css = document.createElement("style");
  css.textContent = `
.diebesnacht .dn-steuerung { font-size: .86rem; color: var(--ash); font-style: italic; }
.dn-buehne { position: relative; width: 100%; max-width: min(100%, calc(78vh * ${W / H})); justify-self: center; aspect-ratio: ${W} / ${H}; border: 1px solid var(--line); background: #0b0a12; overflow: hidden; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; box-shadow: 0 14px 30px rgba(0,0,0,.45); }
.dn-buehne canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: pan-y; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.dn-buehne.laeuft canvas { touch-action: none; }
.dn-schleier { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; padding: clamp(.7rem, 3vw, 1.4rem); background: rgba(9,8,15,.72); text-align: center; overflow-y: auto; }
.dn-schleier[hidden] { display: none; }
.dn-tafel { display: grid; gap: .55rem; justify-items: center; width: 100%; max-width: 30rem; }
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
  .dn-tafel { gap: .4rem; }
  .dn-tafel h4 { font-size: 1.35rem; }
  .dn-tafel p { font-size: .85rem; }
  .dn-tafel .dn-tipp { font-size: .88rem; }
  .dn-tafel .dn-gross { font-size: 2.1rem; }
  .dn-werte { font-size: .78rem; gap: 0 .6rem; grid-template-columns: auto auto auto auto; }
  .dn-tafel .dn-spruch { font-size: 1.1rem; }
  .dn-tafel .dn-haupt { padding: .4rem 1.1rem; font-size: .95rem; }
}
.dn-leise { background: none; border: 0; color: var(--ash); font: inherit; font-size: .85rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: .2rem; }
.dn-knoepfe { position: absolute; right: 6px; bottom: 1.2%; z-index: 2; display: none; gap: 6px; height: 7%; }
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
    stufeLaden, neuesSpiel, begehbar, pfadSuchen, genau, neben, tippen, setStufe: v => { stufeWahl = v; }, zeichnen, anwerfen, update, schleierZu };
})();
