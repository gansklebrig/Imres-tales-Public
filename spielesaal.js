/* =====================================================================
   SPIELESAAL – Übersicht der Tavernenspiele
   ---------------------------------------------------------------------
   Statt alle Spiele untereinander zu zeigen, beginnt die Taverne mit
   Kacheln (Vorschaubild, Genre, ein Satz). Ein Klick öffnet ein Fenster
   mit Bildern zum Durchblättern, Beschreibung, Besonderheiten, Steuerung
   und dem Knopf „Spielen“. Dann ist nur dieses eine Spiel zu sehen, groß,
   mit einer Leiste „← Alle Spiele“ und Schnellwahl zu den anderen.
   Adressen: #taverne = Übersicht, #waldlauf, #auftritt … = ein Spiel.
   Die Zurück-Taste des Browsers funktioniert.
   Bilder liegen in vorschau/ (echte Aufnahmen aus den Spielen).
   ===================================================================== */
(function () {
  "use strict";
  const sektion = document.getElementById("taverne");
  const buehne = sektion && sektion.querySelector(".taverne");
  if (!sektion || !buehne) return;
  const wrap = sektion.querySelector(".wrap");

  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const B = n => "vorschau/" + n + ".webp?v=3"; /* Version erhöhen, wenn Bilder neu aufgenommen werden */

  /* ---------- Die Spiele ---------- */
  const SPIELE = [
    { key: "heldensturm", karte: "heldensturm", extern: "heldensturm.html", held: "barradin.jpg", bilder: [B("heldensturm-1"), B("heldensturm-2"), B("heldensturm-3")], gross: true,
      plakat: B("plakat-heldensturm"), pos: "center 45%", farbe: "#ff7a3d", clip: "vorschau/heldensturm-clip.mp4?v=3", ton: "timp1.mp3", art: "neu", stand: "2026-10-24" },
    { key: "jagd", karte: "waldlauf", held: "friedrich.jpg", bilder: [B("jagd-1"), B("jagd-2"), B("jagd-3")],
      plakat: B("plakat-jagd"), pos: "center 22%", farbe: "#8fd36b", clip: "vorschau/jagd-clip.mp4", ton: "bogen.mp3", art: "update", stand: "2026-10-20" },
    { key: "nacht", karte: "diebesnacht", held: "ezekiel.jpg", bilder: [B("nacht-1"), B("nacht-2")],
      plakat: B("plakat-nacht"), pos: "center 28%", farbe: "#ff5a4e", clip: "vorschau/nacht-clip.mp4", ton: "shake.mp3", art: "update", stand: "2026-10-20" },
    { key: "hort", karte: "echohort", held: "echo.jpg", bilder: [B("hort-1"), B("hort-2"), B("hort-3")],
      plakat: B("plakat-hort"), pos: "52% center", farbe: "#5fd6b8", clip: "vorschau/hort-clip.mp4?v=3", ton: "harfe_76.mp3", art: "update", stand: "2026-10-22" },
    { key: "auftritt", karte: "auftritt", held: "barradin.jpg", bilder: [B("auftritt-1"), B("auftritt-2"), B("auftritt-3")],
      plakat: B("plakat-auftritt"), pos: "center 20%", farbe: "#ffc24a", clip: "vorschau/auftritt-clip.mp4", ton: "gitarre_63.mp3", art: "update", stand: "2026-10-20" },
    { key: "probe", karte: "barden-probe", held: "barradin.jpg", bilder: [B("probe-1"), B("probe-2")],
      plakat: B("plakat-probe"), pos: "30% 35%", farbe: "#d39bff", clip: "vorschau/probe-clip.mp4", nurVorschauClip: true, ton: "holz1.mp3" },
    { key: "memory", karte: "memory-karte", held: "demogorgon.webp", bilder: [B("memory-1")],
      plakat: B("memory-plakat"), pos: "center 15%", farbe: "#7fb2ff", clip: "vorschau/memory-clip.mp4", nurVorschauClip: true, ton: "glock_91.mp3" }
  ];
  /* Sprüche aus Sicht der Helden, Kopf der Taverne, Fortschritt */
  const MEHR = {
    de: {
      spruch: { heldensturm: "Vier Helden. Tausend Goblins. Ein sehr müder Barde.", jagd: "Wie viele Goblins schaffst du, bevor Rex heiser ist?",
        nacht: "Ezekiel nimmt nur, was niemand vermisst. Meistens.", hort: "Was glänzt, gehört Echo. Was nicht glänzt, auch.",
        auftritt: "Vom Hinterhof bis zu den Göttern – kein Ton daneben.", probe: "Eine 20 macht Helden. Eine 1 macht Lieder über dich.",
        memory: "Erinnerst du dich an jedes Monster, das uns fressen wollte?" },
      kopfLabel: "Zeitvertreib", kopfTitel: "Die Taverne",
      kopfText: "Krüge hoch, Würfel raus! Sieben Spiele aus unserer Kampagne – vom Hordenkampf bis zum Loblied. Zieh dir einen Hocker ran.",
      heute: "Heute in der Taverne", jetzt: "▶ Jetzt spielen", mehr: "Mehr erfahren", spielen: "▶ Spielen", weiter: "▶ Weiterspielen",
      neu: "Neu", update: "Frisch", spiele: n => n + " Spiele", rekorde: n => n + (n === 1 ? " Rekord" : " Rekorde"), neuZahl: n => n + " neu",
      tonAn: "Tavernenklänge an", tonAus: "Tavernenklänge aus", nieGespielt: "Noch nie gespielt – trau dich!", deinStand: "Dein Stand",
      stand: {
        heldensturm: d => [d.gold ? "💰 " + d.gold.toLocaleString("de-DE") + " Gold" : "", d.laeufe ? d.laeufe + (d.laeufe === 1 ? " Lauf" : " Läufe") : ""],
        jagd: d => [d.rekord ? "🏆 " + d.rekord.toLocaleString("de-DE") + " Punkte" : "", d.kapitel > 1 ? "Kapitel " + d.kapitel : ""],
        nacht: d => [d.rekord ? "🏆 " + d.rekord.toLocaleString("de-DE") + " Punkte" : "", d.nacht > 1 ? "Nacht " + d.nacht : "", d.taeglich ? "📅 Tägliche Nacht wartet" : ""],
        hort: d => [d.weiter ? "▶ Level " + d.weiter + " gespeichert" : "", d.rekord ? "🏆 " + d.rekord.toLocaleString("de-DE") + " Punkte" : ""],
        auftritt: d => [d.sterne ? "★ " + d.sterne + "/33" : "", d.buehne > 1 ? "Bühne " + d.buehne + "/11" : ""],
        probe: () => ["🎲 Ein Wurf genügt"],
        memory: d => [d.rekord ? "🏆 " + d.rekord + " Züge" : ""]
      }
    },
    en: {
      spruch: { heldensturm: "Four heroes. A thousand goblins. One very tired bard.", jagd: "How many goblins can you drop before Rex goes hoarse?",
        nacht: "Ezekiel only takes what no one will miss. Mostly.", hort: "If it shines, it's Echo's. If it doesn't – also Echo's.",
        auftritt: "From the back alley to the gods – not one wrong note.", probe: "A 20 makes heroes. A 1 makes songs about you.",
        memory: "Do you remember every monster that tried to eat us?" },
      kopfLabel: "Pastimes", kopfTitel: "The Tavern",
      kopfText: "Raise your tankards, roll the dice! Seven games from our campaign – from horde battles to songs of praise. Pull up a stool.",
      heute: "Tonight at the tavern", jetzt: "▶ Play now", mehr: "Learn more", spielen: "▶ Play", weiter: "▶ Continue",
      neu: "New", update: "Fresh", spiele: n => n + " games", rekorde: n => n + (n === 1 ? " record" : " records"), neuZahl: n => n + " new",
      tonAn: "Tavern sounds on", tonAus: "Tavern sounds off", nieGespielt: "Never played – dare you!", deinStand: "Your progress",
      stand: {
        heldensturm: d => [d.gold ? "💰 " + d.gold.toLocaleString("en-GB") + " gold" : "", d.laeufe ? d.laeufe + (d.laeufe === 1 ? " run" : " runs") : ""],
        jagd: d => [d.rekord ? "🏆 " + d.rekord.toLocaleString("en-GB") + " points" : "", d.kapitel > 1 ? "Chapter " + d.kapitel : ""],
        nacht: d => [d.rekord ? "🏆 " + d.rekord.toLocaleString("en-GB") + " points" : "", d.nacht > 1 ? "Night " + d.nacht : "", d.taeglich ? "📅 Daily night awaits" : ""],
        hort: d => [d.weiter ? "▶ Level " + d.weiter + " saved" : "", d.rekord ? "🏆 " + d.rekord.toLocaleString("en-GB") + " points" : ""],
        auftritt: d => [d.sterne ? "★ " + d.sterne + "/33" : "", d.buehne > 1 ? "Stage " + d.buehne + "/11" : ""],
        probe: () => ["🎲 One roll is all it takes"],
        memory: d => [d.rekord ? "🏆 " + d.rekord + " moves" : ""]
      }
    }
  };
  const m = () => MEHR[sprache()];

  /* ---------- Fortschritt aus den Spielständen lesen (nur lesen, nie schreiben) ---------- */
  const lies = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const json = k => { try { return JSON.parse(lies(k) || "null"); } catch (_) { return null; } };
  const maxMitPrefix = pre => { let best = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre)) best = Math.max(best, parseInt(localStorage.getItem(k), 10) || 0); } } catch (_) {} return best; };
  const heuteStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  function fortschritt(key) {
    const d = {};
    if (key === "heldensturm") { const h = json("imres-heldensturm-v1"); if (h) { d.gold = h.gold | 0; d.laeufe = Object.values(h.heroes || {}).reduce((a, x) => a + ((x && x.runs) | 0), 0); } }
    if (key === "jagd") { d.rekord = maxMitPrefix("imres-waldlauf-rekord"); d.kapitel = parseInt(lies("imres-waldlauf-kapitel"), 10) || 0; }
    if (key === "nacht") { d.rekord = maxMitPrefix("imres-diebesnacht-rekord-"); d.nacht = parseInt(lies("imres-diebesnacht-nacht"), 10) || 0;
      d.taeglich = (d.rekord > 0 || d.nacht > 1) && !lies("imres-diebesnacht-tag-" + heuteStr()); }
    if (key === "hort") { const sp = json("imres-echohort-spiel"); if (sp && typeof sp.lv === "number") d.weiter = sp.lv + 1; d.rekord = maxMitPrefix("imres-echohort-rekord-"); }
    if (key === "auftritt") { const w = json("imres-auftritt-weg"); if (w) { d.sterne = (w.sterne || []).reduce((a, b) => a + (b || 0), 0); d.buehne = (w.frei | 0) + 1; }
      d.gespielt = !!lies("imres-auftritt-rekord") || !!d.sterne; }
    if (key === "memory") d.rekord = parseInt(lies("imres-memory-rekord"), 10) || 0;
    const zeilen = m().stand[key](d).filter(Boolean);
    const gespielt = key === "probe" ? true : zeilen.length > 0 || d.gespielt;
    return { zeilen, gespielt, weiter: !!d.weiter, rekord: !!(d.rekord || d.sterne || d.laeufe) };
  }
  /* „Neu“ / „Frisch“: verschwindet, sobald man das Spiel nach der Änderung einmal geöffnet hat (höchstens 14 Tage lang) */
  const gesehenLesen = () => json("imres-saal-gesehen") || {};
  function istNeu(sp) {
    if (!sp.stand) return false;
    const alter = (Date.now() - new Date(sp.stand + "T12:00:00").getTime()) / 864e5;
    if (alter > 14) return false;
    const g = gesehenLesen()[sp.key];
    return !g || g < sp.stand;
  }
  function gesehen(key) { const g = gesehenLesen(); g[key] = heuteStr(); try { localStorage.setItem("imres-saal-gesehen", JSON.stringify(g)); } catch (_) {} }

  /* ---------- Tavernenklänge (aus, bis man sie einschaltet) ---------- */
  let tonAn = lies("imres-saal-ton") === "1";
  const toene = {}; let letzterTon = 0;
  function klingen(sp) {
    if (!tonAn || !sp.ton) return;
    const jetzt = performance.now(); if (jetzt - letzterTon < 220) return; letzterTon = jetzt;
    let a = toene[sp.ton]; if (!a) { a = toene[sp.ton] = new Audio("klang/" + sp.ton); a.preload = "auto"; }
    try { a.pause(); a.currentTime = 0; a.volume = sp.ton === "timp1.mp3" ? .22 : .34; const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (_) {}
  }

  const TX = {
    de: {
      alle: "← Alle Spiele", spielen: "▶ Spielen", oeffnen: "▶ Spiel öffnen", schliessen: "Schließen", mehr: "Mehr erfahren",
      steuerung: "Steuerung", pc: "PC", handy: "Handy", bild: (a, b) => "Bild " + a + " von " + b, zurueck: "Vorheriges Bild", vor: "Nächstes Bild",
      schnell: "Spiel wechseln", eigeneSeite: "öffnet eine eigene Seite",
      spiele: {
        heldensturm: { titel: "Heldensturm", kurz: "Die ganze Kampagne als Hordenkampf – bis nach Gracklstugh.", genre: "Roguelike", wer: "Alle vier Helden",
          text: "Wähle Barradin, Echo, Friedrich oder Ezekiel und kämpf dich durch unsere Kampagne: vom Hinterhalt auf der Straße über Schloss Crackmore, Donnerbaum und das Unterreich bis nach Gracklstugh. Jeder Lauf bringt Beute und Gold, mit dem du im Lager dauerhaft stärker wirst.",
          punkte: ["Lokaler Mehrspieler für bis zu vier Helden an einem Bildschirm – mit Xbox-Controllern, Wiederbeleben und angepasster Schwierigkeit", "Roguelite: Helden behalten Stufe, Talente und Ausrüstung, besiegte Bosse öffnen Portale als Startpunkte – oder Hardcore, jedes Mal von vorn", "Vier Helden mit je 21 Fähigkeiten in drei Talentbäumen – von Barradins Spott bis zu Ezekiels Dawnbringer", "13 Orte mit 28 Stufen, Wetter und Tageszeiten, Elite-Rudel mit 21 Eigenschaften, Wächter und Bosse wie Glasstab, Venomfang, Ilvara und Demogorgon", "Legendäre und verfluchte Gegenstände, 21 Sets (drei Heldensets pro Held und allgemeine Sets für jeden Spielstil), Schmied mit Edelsteinen und Sockeln", "Schreine, explosive Fässer, Mimics, Schatzgoblins, Geheimräume und Würfel-Ereignisse zwischen den Stufen", "Tägliche Herausforderung, Endloser Abstieg und Boss-Rausch mit eigenen Bestenlisten – dazu Bestiarium, Ruhm und Cloud-Spielstand"],
          pc: "WASD oder Pfeiltasten zum Laufen, Shift = Sprinten, Q = Heiltrank, Fähigkeiten 1–6, Esc = Pause, F = Vollbild. Optional: mit der Maus zielen. Xbox-Controller werden erkannt: Stick laufen, A/B/X/Y/LB/RB Fähigkeiten, LT sprinten, RT Heiltrank.", handy: "Links gedrückt halten und ziehen zum Laufen, Fähigkeiten, Sprint und Heiltrank unten rechts antippen." },
        jagd: { titel: "Friedrichs Jagd", kurz: "Die Kampagne als Bogenjagd – mit Rex an der Seite.", genre: "Bogenjagd", wer: "Friedrich & Rex",
          text: "Friedrich erzählt die Kampagne nach, Kapitel für Kapitel: von der Straße nach Phandalin bis nach Gracklstugh. Goblins, Banditen und die Kreaturen des Bestiariums kommen – Rex bellt, bevor sie auftauchen.",
          punkte: ["Zehn Kapitel mit eigener Kulisse und einem Endgegner, danach eine endlose Nacht", "Nach jeder Welle eine Gabe wie Doppelschuss oder Feuerpfeile", "Drei Schwierigkeitsstufen und eine gemeinsame Bestenliste"],
          pc: "Ins Bild klicken, Maus zurückziehen, zielen, loslassen. P = Pause.", handy: "Ins Bild tippen, Finger zurückziehen, zielen, loslassen." },
        nacht: { titel: "Ezekiels lange Nacht", kurz: "Schleichen, stehlen, Schlösser knacken.", genre: "Schleichen & Stehlen", wer: "Ezekiel",
          text: "Fünf Nächte, fünfzehn Orte: Ezekiel leert fremde Taschen, bleibt im Schatten, knackt jede Truhe und ist verschwunden, bevor jemand „Dieb!“ rufen kann.",
          punkte: ["Wachen mit Sichtkegeln, Kerzen zum Auspusten, Fässer zum Verstecken", "Nebenaufträge mit Briefen aus der Kampagne und eine tägliche Nacht", "Diebesversteck mit Ausrüstung, danach geht die Nacht endlos weiter"],
          pc: "Auf einen Ort klicken, um dorthin zu schleichen; Gäste, Wachen und Truhen anklicken.", handy: "Antippen statt klicken – genauso." },
        hort: { titel: "Echos Hort", kurz: "Ein Garten aus Wächtern und Waldtieren, der Welle um Welle verteidigt.", genre: "Tower Defense", wer: "Echo",
          text: "Echo rafft mit seiner Ranke ein paar Schätze zusammen, dann rücken die Plünderer an. Sein Garten aus Dornen, Wurzeln, Eis und Blitz bleibt stehen und wächst von Welle zu Welle – zusammen mit Bär, Eule, Hirsch, Keiler, Falke und Dachs.",
          punkte: ["Acht Gebiete der Kampagne, drei Wellen pro Level, danach endlos", "Sechs Wächter mit je zwei Spezialisierungen und sechs Tiergefährten", "Zauberbuch, Druidenkreis und Schatzkammer für langen Atem"],
          pc: "Klicken, um die Ranke zu schleudern; in der Abwehr Pflanzplätze anklicken.", handy: "Antippen statt klicken; Knöpfe unten verwandeln Echo." },
        auftritt: { titel: "Barradins Auftritt", kurz: "Rhythmusspiel – vom Hinterhof bis zu den Göttern.", genre: "Rhythmusspiel", wer: "Barradin",
          text: "Bass, Laute und Echos Flöte fallen herab – triff die Noten im Takt, dann entscheidet der Auftrittswurf. Gespielt wird mit echten Instrumentenaufnahmen.",
          punkte: ["„Barradins Weg“: elf Bühnen von der Straßenkneipe bis zu den Hallen des Ewigen Liedes", "Zehn Lieder aus der Kampagne – oder Barradin improvisiert ein neues", "Drei Publikumsstufen und eine Bestenliste je Lied"],
          pc: "Tasten A · S · D (oder J · K · L, Pfeiltasten).", handy: "Auf die jeweilige Spur tippen." },
        probe: { titel: "Loblied & Spott", kurz: "Ein W20 entscheidet über Reim und Schmeichelei.", genre: "Würfelprobe", wer: "Barradin",
          text: "Wähle, wen Barradin besingen – oder verspotten – soll, und wirf den W20. Je höher der Wurf, desto prächtiger der Reim. Beim Spott gegen Monster gibt es sogar psychischen Schaden.",
          punkte: ["Loblieder auf die Gruppe, den Spielleiter oder einen eigenen Namen", "Spott gegen die Gegner aus dem Bestiarium", "Natürliche 20 und Patzer mit eigenen Versen"],
          pc: "Ziel wählen, „W20 werfen“ klicken.", handy: "Ziel wählen, „W20 werfen“ antippen." },
        memory: { titel: "Bestiarium-Memory", kurz: "Finde die Paare aus dem Bestiarium.", genre: "Gedächtnis", wer: "Für alle",
          text: "Unter den Karten lauern die Kreaturen aus dem Bestiarium. Decke immer zwei auf und finde alle Paare in möglichst wenigen Zügen.",
          punkte: ["Alle Kreaturen aus dem Bestiarium", "Eigener Rekord wird gespeichert", "Kurz und schnell – perfekt zwischendurch"],
          pc: "Karten anklicken.", handy: "Karten antippen." }
      }
    },
    en: {
      alle: "← All games", spielen: "▶ Play", oeffnen: "▶ Open game", schliessen: "Close", mehr: "Learn more",
      steuerung: "Controls", pc: "PC", handy: "Phone", bild: (a, b) => "Image " + a + " of " + b, zurueck: "Previous image", vor: "Next image",
      schnell: "Switch game", eigeneSeite: "opens its own page",
      spiele: {
        heldensturm: { titel: "Heldensturm", kurz: "The whole campaign as a horde battle – all the way to Gracklstugh.", genre: "Roguelike", wer: "All four heroes",
          text: "Pick Barradin, Echo, Friedrich or Ezekiel and fight through our campaign: from the ambush on the road via Castle Crackmore, Thundertree and the Underdark all the way to Gracklstugh. Every run brings loot and gold to grow permanently stronger at camp.",
          punkte: ["Local multiplayer for up to four heroes on one screen – with Xbox controllers, revives and adjusted difficulty", "Roguelite: heroes keep their level, talents and gear, defeated bosses open portals as starting points – or Hardcore, from scratch every time", "Four heroes with 21 abilities each in three talent trees – from Barradin's mockery to Ezekiel's Dawnbringer", "13 places with 28 stages, weather and time of day, elite packs with 21 traits, guardians and bosses like Glasstab, Venomfang, Ilvara and Demogorgon", "Legendary and cursed items, 21 item sets (three hero sets per hero plus general sets for every playstyle), a blacksmith with gems and sockets", "Shrines, exploding barrels, mimics, treasure goblins, secret rooms and dice events between stages", "Daily challenge, Endless Descent and Boss Rush with their own leaderboards – plus a bestiary, renown and cloud saves"],
          pc: "WASD or arrow keys to move, Shift = sprint, Q = healing potion, abilities 1–6, Esc = pause. Optional: aim with the mouse.", handy: "Hold and drag on the left to move, tap abilities, sprint and potion bottom right." },
        jagd: { titel: "Friedrich's Hunt", kurz: "The campaign as a bow hunt – with Rex at his side.", genre: "Bow hunt", wer: "Friedrich & Rex",
          text: "Friedrich retells the campaign chapter by chapter: from the road to Phandalin all the way to Gracklstugh. Goblins, bandits and the creatures of the bestiary attack – Rex barks before they show up.",
          punkte: ["Ten chapters, each with its own scenery and a boss, then an endless night", "A gift after every wave, like double shot or fire arrows", "Three difficulty levels and a shared leaderboard"],
          pc: "Click into the picture, pull back, aim, let go. P = pause.", handy: "Touch the picture, pull back, aim, let go." },
        nacht: { titel: "Ezekiel's Long Night", kurz: "Sneak, steal, pick locks.", genre: "Stealth & theft", wer: "Ezekiel",
          text: "Five nights, fifteen places: Ezekiel empties strangers' pockets, stays in the shadows, cracks every chest and vanishes before anyone can shout \"Thief!\".",
          punkte: ["Guards with vision cones, candles to blow out, barrels to hide in", "Side jobs with letters from the campaign and a daily night", "A thieves' den with gear – then the night goes on forever"],
          pc: "Click a spot to sneak there; click guests, guards and chests.", handy: "Tap instead of click – same thing." },
        hort: { titel: "Echo's Hoard", kurz: "A garden of guardians and forest animals, defended wave after wave.", genre: "Tower defense", wer: "Echo",
          text: "Echo grabs a few treasures with his vine, then the plunderers march in. His garden of thorns, roots, ice and lightning stays put and grows from wave to wave – together with bear, owl, stag, boar, falcon and badger.",
          punkte: ["Eight campaign regions, three waves per level, then endless", "Six guardians with two specialisations each and six animal companions", "Spellbook, druid circle and treasury for the long run"],
          pc: "Click to hurl the vine; during defense click planting spots.", handy: "Tap instead of click; the buttons below transform Echo." },
        auftritt: { titel: "Barradin's Performance", kurz: "Rhythm game – from the back alley to the gods.", genre: "Rhythm game", wer: "Barradin",
          text: "Bass, lute and Echo's flute come falling down – hit the notes in time, then the performance check decides. Played with real instrument recordings.",
          punkte: ["\"Barradin's Road\": eleven stages from a street pub to the Halls of the Eternal Song", "Ten songs from the campaign – or Barradin improvises a new one", "Three audiences and a leaderboard for every song"],
          pc: "Keys A · S · D (or J · K · L, arrow keys).", handy: "Tap the lane." },
        probe: { titel: "Praise & Mockery", kurz: "A d20 decides rhyme and flattery.", genre: "Dice check", wer: "Barradin",
          text: "Choose who Barradin should praise – or mock – and roll the d20. The higher the roll, the grander the rhyme. Mocking monsters even deals psychic damage.",
          punkte: ["Songs of praise for the party, the game master or any name you like", "Mockery against the foes from the bestiary", "Natural 20s and fumbles with their own verses"],
          pc: "Pick a target, click \"Roll d20\".", handy: "Pick a target, tap \"Roll d20\"." },
        memory: { titel: "Bestiary Memory", kurz: "Find the pairs from the bestiary.", genre: "Memory", wer: "For everyone",
          text: "The creatures from the bestiary lurk beneath the cards. Turn over two at a time and find all pairs in as few moves as possible.",
          punkte: ["Every creature from the bestiary", "Your personal record is saved", "Short and quick – perfect in between"],
          pc: "Click the cards.", handy: "Tap the cards." }
      }
    }
  };
  const t = () => TX[sprache()];
  const vorhanden = sp => { if (sp.extern) return true; const k = document.getElementById(sp.karte); return !!k && !k.hidden; };
  const sichtbare = () => SPIELE.filter(vorhanden);
  const nachKarte = id => SPIELE.find(s => s.karte === id && !s.extern);
  const nachKey = key => SPIELE.find(s => s.key === key);

  /* ---------- Gerüst ---------- */
  const kopf = document.createElement("div"); kopf.className = "saal-kopf";
  const saal = document.createElement("div"); saal.className = "saal"; saal.id = "spielesaal";
  buehne.parentNode.insertBefore(kopf, buehne);
  const leiste = document.createElement("div"); leiste.className = "saal-leiste"; leiste.hidden = true;
  buehne.parentNode.insertBefore(saal, buehne);
  buehne.parentNode.insertBefore(leiste, buehne);
  const dialog = document.createElement("dialog"); dialog.className = "saal-dialog"; dialog.setAttribute("aria-labelledby", "sd-titel");
  document.body.appendChild(dialog);

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const zeiger = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const losHref = sp => sp.extern || "#" + sp.karte;
  /* WebM für Chrome/Firefox/Android, MP4 (H.264) für Safari und iPhone */
  const quellen = clip => '<source src="' + clip.replace(/\.mp4(\?.*)?$/, ".webm$1") + '" type="video/webm"><source src="' + clip + '" type="video/mp4">';

  function kachelnBauen() {
    const T = t(), M = m();
    saal.innerHTML = sichtbare().map((sp, i) => {
      const s = T.spiele[sp.key], f = fortschritt(sp.key), neu = istNeu(sp);
      return '<article class="saal-kachel' + (sp.gross ? " gross" : "") + '" data-key="' + sp.key + '" style="--i:' + i + ";--farbe:" + sp.farbe + '">' +
        '<div class="sk-bild"><img src="' + sp.plakat + '" alt="" decoding="async" loading="lazy" style="object-position:' + sp.pos + '">' +
          (sp.clip && !sp.nurVorschauClip && zeiger && !ruhig ? '<video class="sk-clip" muted loop playsinline preload="none" data-clip="' + sp.clip + '"></video>' : "") +
          '<span class="sk-glanz" aria-hidden="true"></span></div>' +
        '<button type="button" class="sk-flaeche" data-spiel="' + sp.key + '" aria-label="' + esc(s.titel + " – " + M.mehr) + '"></button>' +
        (neu ? '<span class="sk-neu ' + sp.art + '">' + esc(sp.art === "neu" ? M.neu : M.update) + "</span>" : "") +
        '<div class="sk-text">' +
          '<span class="sk-genre">' + esc(s.genre) + "</span>" +
          "<b>" + esc(s.titel) + "</b>" +
          '<i class="sk-spruch">' + esc(M.spruch[sp.key]) + "</i>" +
          '<span class="sk-stand' + (f.gespielt ? "" : " leer") + '">' + esc(f.gespielt ? f.zeilen.join(" · ") : M.nieGespielt) + "</span>" +
          '<span class="sk-aktionen"><a class="sk-los" href="' + losHref(sp) + '" data-gesehen="' + sp.key + '">' + esc(f.weiter ? M.weiter : M.spielen) + (sp.extern ? " ↗" : "") + "</a>" +
            '<span class="sk-mehr" aria-hidden="true">' + esc(M.mehr) + " ›</span></span>" +
        "</div></article>";
    }).join("");
  }

  /* ---------- Kopf: Kerzenschein, Einladung, „Heute in der Taverne“ ---------- */
  const TAGES = ["heldensturm", "jagd", "nacht", "hort", "auftritt"];
  function heutigesSpiel() {
    const tag = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
    const l = TAGES.map(nachKey).filter(sp => sp && vorhanden(sp));
    return l[tag % l.length];
  }
  function kopfBauen() {
    const T = t(), M = m(), sp = heutigesSpiel(), alle = sichtbare();
    const s = T.spiele[sp.key], f = fortschritt(sp.key);
    const rekorde = alle.filter(x => fortschritt(x.key).rekord).length, neue = alle.filter(istNeu).length;
    const funken = Array.from({ length: 16 }, (_, i) => '<span style="--x:' + Math.round(Math.random() * 100) + "%;--d:" + (4 + Math.random() * 5).toFixed(1) + "s;--v:" + (-Math.random() * 8).toFixed(1) + "s;--g:" + (2 + Math.random() * 3).toFixed(1) + 'px"></span>').join("");
    kopf.innerHTML =
      '<div class="sk-kopf-bild" aria-hidden="true"></div><div class="sk-kopf-licht" aria-hidden="true"></div><div class="sk-funken" aria-hidden="true">' + funken + "</div>" +
      '<div class="sk-kopf-text">' +
        '<p class="sk-kopf-label">' + esc(M.kopfLabel) + "</p>" +
        '<h2 class="sk-kopf-titel">' + esc(M.kopfTitel) + "</h2>" +
        '<p class="sk-kopf-satz">' + esc(M.kopfText) + "</p>" +
        '<p class="sk-kopf-chips"><span>🎲 ' + esc(M.spiele(alle.length)) + "</span>" + (rekorde ? "<span>🏆 " + esc(M.rekorde(rekorde)) + "</span>" : "") + (neue ? '<span class="neu">✨ ' + esc(M.neuZahl(neue)) + "</span>" : "") +
          '<button type="button" class="sk-ton" aria-pressed="' + tonAn + '">' + (tonAn ? "🔊 " : "🔈 ") + esc(tonAn ? M.tonAn : M.tonAus) + "</button></p>" +
      "</div>" +
      '<div class="sk-heute" style="--farbe:' + sp.farbe + '">' +
        '<p class="sk-heute-label">✦ ' + esc(M.heute) + " ✦</p>" +
        '<div class="sk-heute-bild" data-spiel="' + sp.key + '">' +
          (ruhig ? '<img src="' + sp.bilder[0] + '" alt="">' : '<video muted loop playsinline preload="none" poster="' + sp.bilder[0] + '">' + quellen(sp.clip) + "</video>") +
          '<img class="sk-heute-held" src="' + sp.held + '" alt="" loading="lazy">' +
        "</div>" +
        '<div class="sk-heute-text"><b>' + esc(s.titel) + "</b><i>" + esc(M.spruch[sp.key]) + "</i>" + (f.gespielt && f.zeilen.length && sp.key !== "probe" ? '<span class="sk-stand">' + esc(f.zeilen.join(" · ")) + "</span>" : "") + "</div>" +
        '<div class="sk-heute-knoepfe"><a class="sk-heute-los" href="' + losHref(sp) + '" data-gesehen="' + sp.key + '">' + esc(f.weiter ? M.weiter : M.jetzt) + (sp.extern ? " ↗" : "") + "</a>" +
          '<button type="button" class="sk-heute-mehr" data-spiel="' + sp.key + '">' + esc(M.mehr) + "</button></div>" +
      "</div>";
    const v = kopf.querySelector("video"); if (v && sektion.classList.contains("aktiv")) { v.muted = true; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
  }
  kopf.addEventListener("click", e => {
    const tk = e.target.closest(".sk-ton");
    if (tk) { tonAn = !tonAn; try { localStorage.setItem("imres-saal-ton", tonAn ? "1" : "0"); } catch (_) {} kopfBauen(); if (tonAn) klingen(nachKey("auftritt")); return; }
    const k = e.target.closest("[data-spiel]"); if (k) vorschau(k.dataset.spiel);
  });

  /* ---------- Lebendige Kacheln: Neigen, Glanz, Clip, Klang ---------- */
  function kachelVon(e) { const k = e.target.closest && e.target.closest(".saal-kachel"); return k && saal.contains(k) ? k : null; }
  if (zeiger && !ruhig) {
    saal.addEventListener("pointermove", e => {
      const k = kachelVon(e); if (!k) return;
      const r = k.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      k.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg"); k.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
      k.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); k.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    });
  }
  saal.addEventListener("pointerover", e => {
    const k = kachelVon(e); if (!k || (e.relatedTarget && k.contains(e.relatedTarget))) return;
    const sp = nachKey(k.dataset.key); if (!sp) return;
    klingen(sp);
    const v = k.querySelector(".sk-clip");
    if (v) { if (!v.dataset.geladen) { v.innerHTML = quellen(v.dataset.clip); v.dataset.geladen = "1"; v.load(); } v.currentTime = 0; const pr = v.play(); if (pr && pr.then) pr.then(() => k.classList.add("spielt")).catch(() => {}); else k.classList.add("spielt"); }
  });
  saal.addEventListener("pointerout", e => {
    const k = kachelVon(e); if (!k || (e.relatedTarget && k.contains(e.relatedTarget))) return;
    k.classList.remove("spielt"); k.style.removeProperty("--rx"); k.style.removeProperty("--ry");
    const v = k.querySelector(".sk-clip"); if (v) setTimeout(() => { if (!k.classList.contains("spielt")) v.pause(); }, 350);
  });
  /* Wer ein Spiel öffnet, hat es „gesehen“ – das Neu-Abzeichen verschwindet */
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("[data-gesehen]"); if (a) gesehen(a.dataset.gesehen); }, true);
  function leisteBauen(aktiv) {
    const T = t();
    leiste.innerHTML = '<a class="saal-alle" href="#taverne">' + esc(T.alle) + "</a>" +
      '<nav class="saal-wahl" aria-label="' + esc(T.schnell) + '">' + sichtbare().map(sp => {
        const s = T.spiele[sp.key], href = sp.extern || "#" + sp.karte;
        return '<a href="' + href + '" data-wahl="' + sp.key + '"' + (sp.key === aktiv ? ' aria-current="page"' : "") + (sp.extern ? ' title="' + esc(T.eigeneSeite) + '"' : "") + ">" +
          '<img src="' + sp.held + '" alt="" loading="lazy">' + esc(s.titel) + (sp.extern ? " ↗" : "") + "</a>";
      }).join("") + "</nav>";
    const a = leiste.querySelector('[aria-current="page"]'), nav = leiste.querySelector(".saal-wahl");
    if (a && nav) nav.scrollLeft = Math.max(0, a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2);
  }

  /* ---------- Vorschau-Fenster ---------- */
  let offenKey = null;
  function vorschau(key) {
    const sp = nachKey(key); if (!sp) return;
    offenKey = key;
    const T = t(), M = m(), s = T.spiele[key], f = fortschritt(key);
    const medien = (sp.clip && !ruhig ? [{ clip: sp.clip, poster: sp.bilder[0] }] : []).concat(sp.bilder.map(b => ({ bild: b }))), n = medien.length;
    dialog.style.setProperty("--farbe", sp.farbe);
    dialog.innerHTML =
      '<form method="dialog" class="sd-zu-form"><button class="sd-zu" aria-label="' + esc(T.schliessen) + '">×</button></form>' +
      '<div class="sd-inhalt">' +
        '<div class="sd-bilder">' +
          '<div class="sd-band" tabindex="0" aria-label="' + esc(s.titel) + '">' + medien.map((x, i) => "<figure>" + (x.clip ? '<video poster="' + x.poster + '" muted loop playsinline autoplay aria-label="' + esc(s.titel) + '">' + quellen(x.clip) + "</video>" : '<img src="' + x.bild + '" alt="' + esc(s.titel + " – " + T.bild(i + 1, n)) + '" decoding="async">') + "</figure>").join("") + "</div>" +
          (n > 1 ? '<button type="button" class="sd-pfeil links" data-schritt="-1" aria-label="' + esc(T.zurueck) + '">‹</button><button type="button" class="sd-pfeil rechts" data-schritt="1" aria-label="' + esc(T.vor) + '">›</button>' +
            '<div class="sd-punkte">' + medien.map((b, i) => '<button type="button" data-bild="' + i + '" aria-label="' + esc(T.bild(i + 1, n)) + '"' + (i ? "" : ' aria-current="true"') + "></button>").join("") + "</div>" : "") +
        "</div>" +
        '<div class="sd-text">' +
          '<p class="sd-genre">' + esc(s.genre) + " · " + esc(s.wer) + "</p>" +
          '<h3 id="sd-titel"><img src="' + sp.held + '" alt="" class="sd-held">' + esc(s.titel) + "</h3>" +
          '<p class="sd-spruch">„' + esc(M.spruch[key]) + "“</p>" +
          "<p>" + esc(s.text) + "</p>" +
          '<ul class="sd-punkteliste">' + s.punkte.map(p => "<li>" + esc(p) + "</li>").join("") + "</ul>" +
          '<div class="sd-steuer"><p class="sd-steuer-titel">' + esc(T.steuerung) + '</p><p><b>' + esc(T.pc) + ":</b> " + esc(s.pc) + "</p><p><b>" + esc(T.handy) + ":</b> " + esc(s.handy) + "</p></div>" +
          (f.gespielt && f.zeilen.length && key !== "probe" ? '<p class="sd-stand"><b>' + esc(M.deinStand) + ":</b> " + esc(f.zeilen.join(" · ")) + "</p>" : "") +
          '<div class="sd-aktionen">' + (sp.extern
            ? '<a class="sd-los" href="' + sp.extern + '" data-gesehen="' + key + '">' + esc(T.spielen) + ' <small>↗</small></a>'
            : '<button type="button" class="sd-los" data-los="' + key + '">' + esc(f.weiter ? M.weiter : T.spielen) + "</button>") +
          '<button type="button" class="sd-leise" data-zu>' + esc(T.schliessen) + "</button></div>" +
        "</div>" +
      "</div>";
    if (!dialog.open) { if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", ""); }
    document.documentElement.classList.add("saal-dialog-offen");
    const band = dialog.querySelector(".sd-band");
    band.scrollLeft = 0;
    const dv = band.querySelector("video"); if (dv) { dv.muted = true; const pr = dv.play(); if (pr && pr.catch) pr.catch(() => {}); }
    band.addEventListener("scroll", () => {
      const i = Math.round(band.scrollLeft / Math.max(1, band.clientWidth));
      dialog.querySelectorAll(".sd-punkte button").forEach((b, k) => b.toggleAttribute("aria-current", k === i));
    }, { passive: true });
    band.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); blaettern(e.key === "ArrowRight" ? 1 : -1); } });
    const los = dialog.querySelector(".sd-los"); if (los) los.focus({ preventScroll: true });
  }
  function blaettern(schritt, ziel) {
    const band = dialog.querySelector(".sd-band"); if (!band) return;
    const n = band.children.length, w = band.clientWidth;
    let i = ziel != null ? ziel : Math.round(band.scrollLeft / Math.max(1, w)) + schritt;
    if (i < 0) i = n - 1; if (i >= n) i = 0;
    band.scrollTo({ left: i * w, behavior: "smooth" });
  }
  function vorschauZu() { if (dialog.open) { if (dialog.close) dialog.close(); else dialog.removeAttribute("open"); } }
  dialog.addEventListener("close", () => { const dv = dialog.querySelector("video"); if (dv) dv.pause(); offenKey = null; document.documentElement.classList.remove("saal-dialog-offen"); });
  dialog.addEventListener("click", e => {
    if (e.target === dialog) { vorschauZu(); return; } /* Klick neben das Fenster */
    const p = e.target.closest("[data-schritt]"); if (p) { blaettern(+p.dataset.schritt); return; }
    const d = e.target.closest("[data-bild]"); if (d) { blaettern(0, +d.dataset.bild); return; }
    if (e.target.closest("[data-zu]")) { vorschauZu(); return; }
    const l = e.target.closest("[data-los]"); if (l) { const sp = nachKey(l.dataset.los); vorschauZu(); if (sp) { gesehen(sp.key); spielZeigen(sp.karte, true); } }
  });

  /* ---------- Ansichten: Übersicht oder ein Spiel ---------- */
  let aktiv = null;
  function laufendeStoppen(ausser) {
    /* Barradins Auftritt spielt Musik weiter, wenn man ihn nur ausblendet – also abbrechen */
    const at = document.getElementById("auftritt");
    if (at && ausser !== "auftritt" && at._zustand) { const z = at._zustand(); if (z.spiel || z.stimmt) { const k = at.querySelector(".at-start"); if (k) k.click(); } }
    /* Vollbild der Tavernenkarte beenden */
    const v = buehne.querySelector(".tav-karte.tav-voll > .tav-voll-knopf"); if (v) v.click();
  }
  function uebersichtZeigen() {
    laufendeStoppen();
    aktiv = null;
    sektion.classList.remove("saal-einzeln");
    buehne.querySelectorAll(":scope > .tav-karte").forEach(k => k.classList.remove("saal-aktiv"));
    saal.hidden = false; leiste.hidden = true; kopf.hidden = false;
    /* Fortschritt kann sich beim Spielen geändert haben */
    kachelnBauen(); kopfBauen();
  }
  function spielZeigen(kartenId, merken) {
    const sp = nachKarte(kartenId); if (!sp || !vorhanden(sp)) { uebersichtZeigen(); return; }
    if (aktiv !== kartenId) laufendeStoppen(kartenId);
    aktiv = kartenId;
    sektion.classList.add("saal-einzeln");
    buehne.querySelectorAll(":scope > .tav-karte").forEach(k => k.classList.toggle("saal-aktiv", k.id === kartenId));
    saal.hidden = true; leiste.hidden = false; kopf.hidden = true;
    const kv = kopf.querySelector("video"); if (kv) kv.pause();
    gesehen(sp.key);
    leisteBauen(sp.key);
    if (merken && location.hash !== "#" + kartenId) { try { history.pushState(null, "", "#" + kartenId); } catch (_) {} }
    obenHin();
    requestAnimationFrame(() => { hoeheSetzen(); window.dispatchEvent(new Event("resize")); });
    if (hoeheWache) { hoeheWache.disconnect(); const k = document.getElementById(kartenId); if (k) hoeheWache.observe(k); }
  }
  /* Spielfläche so hoch machen, wie unter Leiste und Steuerungshinweis noch Platz im Fenster ist */
  const FLAECHE = { waldlauf: [".wl-buehne", 14], diebesnacht: [".dn-buehne", 14], echohort: [".eh-buehne", 14], auftritt: [".at-canvas", 120] };
  function hoeheSetzen() {
    if (!aktiv || !FLAECHE[aktiv]) return;
    const el = document.querySelector("#" + aktiv + " " + FLAECHE[aktiv][0]); if (!el) return;
    const oben = el.getBoundingClientRect().top + window.pageYOffset;
    const h = Math.max(300, Math.round(window.innerHeight - oben - FLAECHE[aktiv][1]));
    if (sektion.style.getPropertyValue("--sh") !== h + "px") sektion.style.setProperty("--sh", h + "px");
  }
  const hoeheWache = window.ResizeObserver ? new ResizeObserver(() => requestAnimationFrame(hoeheSetzen)) : null;
  window.addEventListener("resize", () => { if (aktiv) hoeheSetzen(); });
  function obenHin() { requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }))); }
  /* Adresse auswerten (beim Laden, Zurück-Taste, Links von anderswo) */
  function ausAdresse() {
    const id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    const sp = nachKarte(id);
    if (sp && vorhanden(sp)) spielZeigen(id, false);
    else uebersichtZeigen();
  }

  /* ---------- Klicks ---------- */
  saal.addEventListener("click", e => { const k = e.target.closest("[data-spiel]"); if (k) vorschau(k.dataset.spiel); });
  /* Links auf die Taverne oder ein Spiel – seiten.js hat die Adresse dann schon gesetzt */
  document.addEventListener("click", e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (id !== "taverne" && !nachKarte(id)) return;
    e.preventDefault();
    if (location.hash !== "#" + id) { try { history.pushState(null, "", "#" + id); } catch (_) {} }
    if (id === "taverne") { uebersichtZeigen(); obenHin(); } else spielZeigen(id, false);
  });
  window.addEventListener("popstate", () => setTimeout(() => { ausAdresse(); if (aktiv) obenHin(); }, 0));
  window.addEventListener("hashchange", () => setTimeout(() => { ausAdresse(); if (aktiv) obenHin(); }, 0));

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
/* ---------- Kopf der Taverne ---------- */
#taverne:not(.saal-einzeln) .part-head { display: none; }
.saal-kopf {
  position: relative; overflow: hidden; isolation: isolate; margin-bottom: clamp(1.4rem, 4vw, 2.4rem);
  display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(1rem, 3vw, 2.5rem); align-items: center;
  min-height: clamp(380px, 46vw, 500px); padding: clamp(1.4rem, 4vw, 2.8rem);
  border: 1px solid rgba(224,160,70,.45); background: #120e14;
  box-shadow: 0 30px 70px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,210,140,.05);
}
.saal-kopf[hidden] { display: none; }
.sk-kopf-bild { position: absolute; inset: 0; z-index: -3; background: url("vorschau/taverne-kopf.webp") center 35% / cover no-repeat; filter: saturate(1.1) brightness(.55); transform: scale(1.04); animation: kopfAtmen 18s ease-in-out infinite alternate; }
.saal-kopf::before { content: ""; position: absolute; inset: 0; z-index: -2; background: linear-gradient(95deg, rgba(14,10,16,.96) 0%, rgba(14,10,16,.82) 42%, rgba(14,10,16,.35) 75%, rgba(14,10,16,.55)), linear-gradient(0deg, rgba(14,10,16,.85), transparent 45%); }
.sk-kopf-licht { position: absolute; inset: -20%; z-index: -1; pointer-events: none; mix-blend-mode: screen;
  background: radial-gradient(38% 46% at 22% 70%, rgba(255,160,60,.30), transparent 70%), radial-gradient(30% 40% at 78% 25%, rgba(255,190,110,.18), transparent 70%);
  animation: flackern 3.2s steps(1) infinite, flackernWeich 7s ease-in-out infinite alternate; }
@keyframes flackern { 0%,100% { opacity: .95 } 12% { opacity: .78 } 18% { opacity: 1 } 41% { opacity: .86 } 47% { opacity: .98 } 63% { opacity: .82 } 71% { opacity: 1 } 88% { opacity: .9 } }
@keyframes flackernWeich { from { transform: translate(-1%, 1%) scale(1); } to { transform: translate(1%, -1%) scale(1.05); } }
@keyframes kopfAtmen { from { transform: scale(1.04); } to { transform: scale(1.1) translate(-1%, 1%); } }
.sk-funken { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
.sk-funken span { position: absolute; bottom: -10px; left: var(--x); width: var(--g); height: var(--g); border-radius: 50%; background: #ffcf7a; box-shadow: 0 0 8px 2px rgba(255,160,60,.8); opacity: 0; animation: funke var(--d) linear infinite; animation-delay: var(--v); }
@keyframes funke { 0% { opacity: 0; transform: translate(0, 0); } 10% { opacity: .95; } 70% { opacity: .6; } 100% { opacity: 0; transform: translate(40px, -460px); } }
.sk-ton { padding: .3rem .8rem; border: 1px dashed rgba(224,160,70,.5); border-radius: 999px; background: rgba(10,8,12,.55); color: #d9cbb2; font: inherit; font-size: .82rem; cursor: pointer; transition: border-color .2s, color .2s, box-shadow .2s; }
.sk-ton:hover { border-color: var(--ember); color: var(--vellum); }
.sk-ton[aria-pressed="true"] { border-style: solid; border-color: var(--ember); color: var(--ember); box-shadow: 0 0 14px rgba(224,160,70,.35); }
.sk-kopf-text { display: grid; gap: .7rem; align-content: center; }
.sk-kopf-label { margin: 0; font-size: .74rem; letter-spacing: .26em; text-transform: uppercase; color: var(--ember); }
.sk-kopf-titel { margin: 0; font-family: var(--display); font-weight: 400; font-size: clamp(2.8rem, 8vw, 5.4rem); line-height: .95; color: #fff2d8;
  text-shadow: 0 0 24px rgba(255,170,70,.45), 0 0 60px rgba(255,140,40,.25), 0 4px 0 rgba(0,0,0,.4); animation: titelGlut 4s ease-in-out infinite alternate; }
@keyframes titelGlut { from { text-shadow: 0 0 18px rgba(255,170,70,.35), 0 0 50px rgba(255,140,40,.18), 0 4px 0 rgba(0,0,0,.4); } to { text-shadow: 0 0 28px rgba(255,180,80,.6), 0 0 80px rgba(255,140,40,.32), 0 4px 0 rgba(0,0,0,.4); } }
.sk-kopf-satz { margin: 0; max-width: 32rem; font-size: clamp(1rem, 2.2vw, 1.18rem); line-height: 1.55; color: #e9dcc4; }
.sk-kopf-chips { margin: .3rem 0 0; display: flex; flex-wrap: wrap; gap: .45rem; }
.sk-kopf-chips span { padding: .3rem .75rem; border: 1px solid rgba(224,160,70,.4); border-radius: 999px; background: rgba(10,8,12,.55); font-size: .82rem; color: #f3e6cf; backdrop-filter: blur(4px); }
.sk-kopf-chips .neu { border-color: var(--ember); color: var(--ember); }

.sk-heute { position: relative; display: grid; gap: .65rem; padding: .9rem; border: 1px solid var(--farbe); background: linear-gradient(160deg, rgba(20,15,22,.88), rgba(12,9,14,.94)); backdrop-filter: blur(6px);
  box-shadow: 0 0 0 1px rgba(0,0,0,.4), 0 18px 50px rgba(0,0,0,.6), 0 0 40px color-mix(in srgb, var(--farbe) 30%, transparent); transform: rotate(1.2deg); animation: heuteSchweben 6s ease-in-out infinite alternate; }
@keyframes heuteSchweben { from { transform: rotate(1.2deg) translateY(0); } to { transform: rotate(.4deg) translateY(-6px); } }
.sk-heute-label { margin: 0; text-align: center; font-size: .7rem; letter-spacing: .24em; text-transform: uppercase; color: var(--farbe); }
.sk-heute-bild { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: #07060a; cursor: pointer; border: 1px solid rgba(255,255,255,.06); }
.sk-heute-bild video, .sk-heute-bild > img:first-child { width: 100%; height: 100%; object-fit: cover; display: block; }
.sk-heute-held { position: absolute; left: .6rem; bottom: .6rem; width: 3.2rem; height: 3.2rem; border-radius: 50%; object-fit: cover; object-position: top; border: 2px solid var(--farbe); box-shadow: 0 4px 14px rgba(0,0,0,.6); }
.sk-heute-text { display: grid; gap: .2rem; }
.sk-heute-text b { font-family: var(--display); font-weight: 400; font-size: clamp(1.35rem, 3vw, 1.75rem); line-height: 1.05; color: #fff2d8; }
.sk-heute-text i { color: #d9cbb2; font-size: .92rem; }
.sk-heute-text .sk-stand { color: var(--farbe); font-size: .8rem; }
.sk-heute-knoepfe { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.sk-heute-los { display: inline-flex; align-items: center; padding: .65rem 1.3rem; background: var(--farbe); color: #120e14; font-weight: 700; text-decoration: none; letter-spacing: .02em;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--farbe) 60%, transparent); animation: puls 2.4s ease-out infinite; transition: transform .15s, filter .15s; }
.sk-heute-los:hover { transform: translateY(-2px); filter: brightness(1.1); }
@keyframes puls { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--farbe) 55%, transparent); } 70%, 100% { box-shadow: 0 0 0 14px transparent; } }
.sk-heute-mehr { border: 0; background: none; color: #e9dcc4; font: inherit; font-size: .9rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: .4rem; }
.sk-heute-mehr:hover { color: var(--farbe); }
@media (max-width: 860px) {
  .saal-kopf { grid-template-columns: minmax(0, 1fr); padding: 1.3rem 1rem 1.1rem; min-height: 0; }
  .saal-kopf::before { background: linear-gradient(180deg, rgba(14,10,16,.7) 0%, rgba(14,10,16,.88) 45%, rgba(14,10,16,.97)); }
  .sk-heute { transform: none; animation: none; }
  .sk-kopf-satz { font-size: 1rem; }
}

/* ---------- Plakate ---------- */
.saal { display: grid; gap: clamp(.75rem, 2vw, 1.2rem); grid-template-columns: repeat(2, minmax(0, 1fr)); perspective: 1200px; }
@media (min-width: 900px) { .saal { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.saal[hidden] { display: none; }
.saal-kachel {
  --rx: 0deg; --ry: 0deg; --mx: 50%; --my: 30%;
  position: relative; display: block; min-height: clamp(270px, 34vw, 400px); overflow: hidden; isolation: isolate;
  border: 1px solid color-mix(in srgb, var(--farbe) 35%, var(--line)); background: #120e14; color: inherit;
  transform: rotateX(var(--rx)) rotateY(var(--ry)); transform-style: preserve-3d;
  transition: transform .35s cubic-bezier(.2,.8,.3,1), border-color .3s, box-shadow .35s;
  animation: saalEin .7s cubic-bezier(.2,.8,.3,1) backwards; animation-delay: calc(var(--i) * 70ms);
  box-shadow: 0 10px 28px rgba(0,0,0,.45);
}
.saal-kachel.gross { grid-column: span 2; }
@keyframes saalEin { from { opacity: 0; transform: translateY(26px) scale(.97); } }
.saal-kachel:hover, .saal-kachel:focus-within {
  transform: rotateX(var(--rx)) rotateY(var(--ry)) translateY(-6px); border-color: var(--farbe);
  box-shadow: 0 0 0 1px var(--farbe), 0 22px 48px rgba(0,0,0,.6), 0 0 42px color-mix(in srgb, var(--farbe) 38%, transparent); z-index: 1;
}
.sk-bild { position: absolute; inset: 0; z-index: -1; }
.sk-bild img, .sk-clip { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sk-bild img { filter: saturate(1.05) brightness(.82); transition: transform 1.1s cubic-bezier(.2,.8,.3,1), filter .5s; }
.saal-kachel:hover .sk-bild img { transform: scale(1.08); filter: saturate(1.2) brightness(.95); }
.sk-clip { opacity: 0; transition: opacity .45s; }
.saal-kachel.spielt .sk-clip { opacity: 1; }
.sk-bild::after { content: ""; position: absolute; inset: 0; background:
  linear-gradient(180deg, rgba(12,9,14,0) 30%, color-mix(in srgb, var(--farbe) 14%, rgba(12,9,14,.7)) 62%, rgba(12,9,14,.97) 100%),
  linear-gradient(0deg, color-mix(in srgb, var(--farbe) 22%, transparent), transparent 40%); }
.sk-glanz { position: absolute; inset: 0; opacity: 0; transition: opacity .35s; mix-blend-mode: soft-light; pointer-events: none;
  background: radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.55), rgba(255,255,255,0) 45%); }
.saal-kachel:hover .sk-glanz { opacity: 1; }
.sk-flaeche { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; padding: 0; border: 0; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.sk-flaeche:focus-visible { outline: 2px solid var(--farbe); outline-offset: -4px; }
.sk-neu { position: absolute; z-index: 2; top: .75rem; left: -2.1rem; width: 8rem; transform: rotate(-35deg); text-align: center; padding: .22rem 0; font-size: .66rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
  background: var(--farbe); color: #120e14; box-shadow: 0 4px 12px rgba(0,0,0,.5); pointer-events: none; }
.sk-neu.neu { animation: neuGlanz 2.2s ease-in-out infinite; }
@keyframes neuGlanz { 50% { filter: brightness(1.3); box-shadow: 0 0 18px var(--farbe); } }
.sk-text { position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; padding: 1rem 1rem 1.05rem; display: grid; gap: .3rem; justify-items: start; pointer-events: none; transform: translateZ(30px); }
.sk-genre { font-size: .62rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #120e14; background: var(--farbe); padding: .12rem .5rem; }
.sk-text b { font-family: var(--display); font-weight: 400; font-size: clamp(1.25rem, 2.4vw, 1.7rem); line-height: 1.02; color: #fff4de; text-shadow: 0 2px 12px rgba(0,0,0,.8); }
.saal-kachel.gross .sk-text b { font-size: clamp(1.7rem, 4vw, 2.7rem); }
.sk-spruch { font-size: .86rem; line-height: 1.35; color: #e6d8bf; text-shadow: 0 1px 6px rgba(0,0,0,.9); }
.saal-kachel.gross .sk-spruch { font-size: 1rem; max-width: 30rem; }
.sk-stand { font-size: .76rem; font-weight: 600; color: var(--farbe); text-shadow: 0 1px 6px rgba(0,0,0,.9); }
.sk-stand.leer { font-weight: 400; font-style: italic; color: #bfb19a; }
.sk-aktionen { display: flex; align-items: center; gap: .7rem; margin-top: .35rem; }
.sk-los { pointer-events: auto; position: relative; z-index: 3; display: inline-flex; align-items: center; padding: .45rem .95rem; background: var(--farbe); color: #120e14; font-weight: 700; font-size: .88rem; text-decoration: none;
  box-shadow: 0 6px 16px rgba(0,0,0,.45); transition: transform .15s, filter .15s; }
.sk-los:hover, .sk-los:focus-visible { transform: translateY(-2px) scale(1.04); filter: brightness(1.12); outline: none; }
.sk-mehr { font-size: .8rem; color: #e6d8bf; opacity: .85; }
@media (hover: hover) and (pointer: fine) {
  .sk-aktionen { opacity: 0; transform: translateY(8px); transition: opacity .3s, transform .3s; }
  .saal-kachel:hover .sk-aktionen, .saal-kachel:focus-within .sk-aktionen { opacity: 1; transform: none; }
}
@media (max-width: 560px) {
  .saal-kachel { min-height: 255px; }
  .saal-kachel.gross { min-height: 230px; }
  .sk-text { padding: .7rem .7rem .75rem; gap: .22rem; }
  .sk-text b { font-size: 1.12rem; }
  .sk-spruch { font-size: .74rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .sk-stand { font-size: .68rem; }
  .sk-los { padding: .38rem .7rem; font-size: .8rem; }
  .sk-mehr { display: none; }
  .sk-neu { top: .55rem; left: -2.3rem; font-size: .58rem; }
}

/* Ein Spiel */
.saal-leiste { display: flex; align-items: center; gap: .8rem 1rem; flex-wrap: wrap; margin-bottom: 1rem; padding-bottom: .8rem; border-bottom: 1px solid var(--line); }
.saal-leiste[hidden] { display: none; }
.saal-alle { flex: none; display: inline-flex; align-items: center; padding: .5rem .95rem; border: 1px solid var(--ember); color: var(--ember); text-decoration: none; font-size: .92rem; }
.saal-alle:hover, .saal-alle:focus-visible { background: var(--ember); color: var(--night); }
.saal-wahl { flex: 1 1 18rem; min-width: 0; display: flex; gap: .4rem; overflow-x: auto; scrollbar-width: thin; padding: .15rem 0; }
.saal-wahl a { flex: none; display: inline-flex; align-items: center; gap: .45rem; padding: .3rem .75rem .3rem .3rem; border: 1px solid var(--line); border-radius: 999px; color: var(--ash); text-decoration: none; font-size: .84rem; white-space: nowrap; }
.saal-wahl img { width: 1.6rem; height: 1.6rem; border-radius: 50%; object-fit: cover; object-position: top; }
.saal-wahl a:hover { color: var(--vellum); border-color: var(--ash); }
.saal-wahl a[aria-current="page"] { color: var(--ember); border-color: var(--ember); background: rgba(224,160,70,.12); }
@media (max-width: 600px) { .saal-leiste { gap: .6rem; } .saal-wahl { flex-basis: 100%; } }

#taverne .taverne { display: none; }
#taverne.saal-einzeln .taverne { display: grid; grid-template-columns: minmax(0, 1fr); }
#taverne.saal-einzeln .taverne > .tav-karte { display: none; }
#taverne.saal-einzeln .taverne > .tav-karte.saal-aktiv { display: grid; grid-column: 1 / -1; }
#taverne.saal-einzeln .part-head, #taverne.saal-einzeln .bereich-zurueck { display: none; }
/* Titel und Beschreibung stehen schon in Leiste und Vorschau – bei den großen Spielen ausblenden */
#taverne.saal-einzeln :is(#waldlauf, #diebesnacht, #echohort) > :is(.label, h3, .tav-info),
#taverne.saal-einzeln #auftritt > :is(.label, h3) { display: none; }
#taverne.saal-einzeln :is(#waldlauf, #diebesnacht, #echohort) { padding-top: clamp(.8rem, 2vw, 1.2rem); }
#taverne.saal-einzeln .hat-voll > :is(.dn-steuerung, .eh-steuerung) { padding-right: 2.8rem; }
#taverne .heldensturm-karte { display: none !important; }

/* Spielflächen in der Einzelansicht groß, aber ganz im Fenster */
#taverne.saal-einzeln { --sh: calc(100vh - 15rem); }
#taverne.saal-einzeln .wl-buehne, #taverne.saal-einzeln .wl-liste, #taverne.saal-einzeln .wl-fuss,
#taverne.saal-einzeln .eh-buehne, #taverne.saal-einzeln .eh-liste, #taverne.saal-einzeln .eh-fuss { max-width: min(100%, max(300px, calc(var(--sh) * .8))); }
#taverne.saal-einzeln .dn-buehne, #taverne.saal-einzeln .dn-liste, #taverne.saal-einzeln .dn-fuss { max-width: min(100%, max(300px, calc(var(--sh) * ${400 / 560}))); }
#taverne.saal-einzeln .wl-fuss, #taverne.saal-einzeln .eh-fuss, #taverne.saal-einzeln .dn-fuss { width: 100%; justify-self: center; }
#taverne.saal-einzeln .at-buehne, #taverne.saal-einzeln .at-liste { max-width: min(100%, 820px); }
#taverne.saal-einzeln .tav-karte:not(.tav-voll) .at-canvas { height: clamp(300px, var(--sh), 600px); }
#taverne.saal-einzeln #barden-probe, #taverne.saal-einzeln #memory-karte { max-width: 820px; width: 100%; justify-self: center; }
#taverne.saal-einzeln .tav-karte > .tav-info, #taverne.saal-einzeln .wl-steuerung, #taverne.saal-einzeln .dn-steuerung, #taverne.saal-einzeln .eh-steuerung { max-width: 48rem; }

/* Vorschau-Fenster */
.saal-dialog { --farbe: var(--ember); width: min(1040px, calc(100vw - 2rem)); max-height: calc(100vh - 2rem); padding: 0; border: 1px solid var(--farbe); background: var(--hall, #16121a); color: var(--vellum); box-shadow: 0 30px 80px rgba(0,0,0,.7); overflow: hidden; }
.saal-dialog[open] { display: flex; flex-direction: column; animation: sdEin .25s ease; }
@keyframes sdEin { from { opacity: 0; transform: translateY(14px) scale(.985); } }
.saal-dialog::backdrop { background: rgba(6,5,10,.78); backdrop-filter: blur(3px); }
html.saal-dialog-offen { overflow: hidden; }
.sd-zu-form { position: absolute; top: .5rem; right: .5rem; z-index: 3; margin: 0; }
.sd-zu { width: 2.4rem; height: 2.4rem; border: 1px solid var(--line); border-radius: 50%; background: rgba(9,8,15,.7); color: var(--vellum); font-size: 1.4rem; line-height: 1; cursor: pointer; }
.sd-zu:hover { border-color: var(--ember); color: var(--ember); }
.sd-inhalt { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); min-height: 0; overflow: auto; }
.sd-bilder { position: relative; background: #08070c; }
.saal-dialog { --bh: min(72vh, 640px); }
.sd-band { display: flex; height: var(--bh); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; outline: none; }
.sd-band::-webkit-scrollbar { display: none; }
.sd-band figure { flex: 0 0 100%; height: 100%; box-sizing: border-box; margin: 0; scroll-snap-align: center; display: grid; place-items: center; padding: .8rem .8rem 1.8rem; }
.sd-band img { max-width: 100%; max-height: calc(var(--bh) - 2.6rem); object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
.sd-pfeil { position: absolute; top: 50%; transform: translateY(-50%); width: 2.6rem; height: 2.6rem; border: 1px solid var(--line); border-radius: 50%; background: rgba(9,8,15,.7); color: var(--vellum); font-size: 1.6rem; line-height: 1; cursor: pointer; }
.sd-pfeil.links { left: .6rem; } .sd-pfeil.rechts { right: .6rem; }
.sd-pfeil:hover { border-color: var(--ember); color: var(--ember); }
.sd-punkte { position: absolute; left: 0; right: 0; bottom: .5rem; display: flex; justify-content: center; gap: .45rem; }
.sd-punkte button { width: .7rem; height: .7rem; padding: 0; border: 1px solid var(--vellum); border-radius: 50%; background: transparent; opacity: .6; cursor: pointer; }
.sd-punkte button[aria-current] { background: var(--farbe); border-color: var(--farbe); opacity: 1; }
.sd-text { display: grid; align-content: start; gap: .8rem; padding: clamp(1.2rem, 3vw, 2rem); padding-top: clamp(1.4rem, 3vw, 2.4rem); }
.sd-text p { margin: 0; color: var(--ash); line-height: 1.6; }
.sd-genre { font-size: .7rem !important; letter-spacing: .16em; text-transform: uppercase; color: var(--farbe) !important; }
.sd-spruch { font-family: var(--name); font-style: italic; font-size: 1.12rem !important; color: #f3e6cf !important; }
.sd-stand { font-size: .88rem; color: var(--farbe) !important; }
.sd-stand b { color: var(--vellum); }
.sd-band video { max-width: 100%; max-height: calc(var(--bh) - 2.6rem); object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
.sd-text h3 { margin: 0; display: flex; align-items: center; gap: .7rem; font-family: var(--name); font-weight: 400; font-size: clamp(1.6rem, 4vw, 2.3rem); line-height: 1.05; color: var(--vellum); padding-right: 2rem; }
.sd-held { flex: none; width: 2.8rem; height: 2.8rem; border-radius: 50%; object-fit: cover; object-position: top; border: 2px solid var(--farbe); }
.sd-punkteliste { margin: 0; padding: 0; list-style: none; display: grid; gap: .4rem; }
.sd-punkteliste li { position: relative; padding-left: 1.3rem; color: var(--vellum); font-size: .93rem; line-height: 1.45; }
.sd-punkteliste li::before { content: "✦"; position: absolute; left: 0; color: var(--ember); font-size: .8rem; top: .1rem; }
.sd-steuer { border: 1px solid var(--line); background: rgba(0,0,0,.2); padding: .65rem .8rem; display: grid; gap: .25rem; }
.sd-steuer p { font-size: .85rem; line-height: 1.45; }
.sd-steuer b { color: var(--vellum); font-weight: 600; }
.sd-steuer-titel { font-size: .68rem !important; letter-spacing: .16em; text-transform: uppercase; color: var(--ember) !important; }
.sd-aktionen { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin-top: .2rem; }
.sd-los { display: inline-flex; align-items: center; gap: .4rem; padding: .75rem 1.6rem; border: 1px solid var(--farbe); background: var(--farbe); color: #120e14; font: inherit; font-size: 1.05rem; font-weight: 700; text-decoration: none; cursor: pointer; }
.sd-los:hover, .sd-los:focus-visible { filter: brightness(1.12); outline: none; box-shadow: 0 0 26px color-mix(in srgb, var(--farbe) 50%, transparent); }
.sd-leise { border: 0; background: none; color: var(--ash); font: inherit; font-size: .9rem; text-decoration: underline; cursor: pointer; padding: .5rem; }
.sd-leise:hover { color: var(--vellum); }

/* Handy: Fenster über den ganzen Bildschirm, Bilder oben zum Wischen, Spielen-Knopf immer sichtbar */
@media (max-width: 760px) {
  .saal-dialog { width: 100vw; max-width: 100vw; height: 100%; max-height: 100%; margin: 0; border: 0; }
  .sd-inhalt { grid-template-columns: minmax(0, 1fr); grid-auto-rows: max-content; flex: 1 1 auto; }
  .saal-dialog { --bh: min(48vh, 420px); }
  .sd-pfeil { display: none; }
  .sd-text { padding-bottom: 0; }
  .sd-aktionen { position: sticky; bottom: 0; margin: 0 calc(-1 * clamp(1.2rem, 3vw, 2rem)); padding: .8rem clamp(1.2rem, 3vw, 2rem) calc(.8rem + env(safe-area-inset-bottom, 0px)); background: linear-gradient(180deg, rgba(22,18,26,.85), var(--hall, #16121a) 35%); border-top: 1px solid var(--line); }
  .sd-los { flex: 1; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) { .saal-kachel, .saal-dialog[open], .sk-kopf-bild, .sk-kopf-licht, .sk-kopf-titel, .sk-heute, .sk-heute-los, .sk-neu.neu { animation: none !important; } .sk-funken { display: none; } .saal-kachel, .saal-kachel img { transition: none; } }
`;
  document.head.appendChild(css);

  /* Für Startseite und Heldenbögen (wegweiser.js): dieselben Daten wie in der Taverne */
  window.ImresSpielesaal = { SPIELE, nachKey, vorhanden, fortschritt, heutigesSpiel, quellen, losHref, gesehen, texte: () => t(), mehr: () => m() };

  /* ---------- Start ---------- */
  kachelnBauen(); kopfBauen();
  ausAdresse();
  /* Kopf-Clip nur abspielen, wenn er zu sehen ist */
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { const v = kopf.querySelector("video"); if (!v) return; if (es[0].isIntersecting && !kopf.hidden) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } else v.pause(); }, { threshold: .2 }).observe(kopf);
  if (aktiv) obenHin();
  /* Memory erscheint erst, wenn das Bestiarium geladen ist – Kacheln dann neu bauen */
  setTimeout(() => { if (!aktiv) { kachelnBauen(); kopfBauen(); } else leisteBauen((nachKarte(aktiv) || {}).key); }, 1500);
  let letzteSprache = sprache();
  new MutationObserver(() => {
    if (sprache() === letzteSprache) return; letzteSprache = sprache();
    kachelnBauen(); kopfBauen(); if (aktiv) leisteBauen((nachKarte(aktiv) || {}).key); if (offenKey) vorschau(offenKey);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
