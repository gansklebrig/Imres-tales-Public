/* =====================================================================
   ECHOS HORT – Raubzug, Wildgestalt und der Zorn des Hains
   Acht Gebiete wie in der Kampagne (Wald an der Straße, Phandalin,
   Wachturm, magische Schmiede, Donnerbaum, Unterreich, See der Kuo-Toa,
   Gracklstugh), je drei Level, danach geht es endlos weiter.
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
      text: "Echo schleudert seine Ranke in die Tiefe, verwandelt sich in Rabe, Bär oder Ratte und rafft zusammen, was glänzt. Danach kommen die Plünderer, und der Hain muss den Hort verteidigen. Acht Gebiete wie in unserer Kampagne, viele Level, noch mehr Verbesserungen.",
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
        ["Gracklstugh", "Die Festung der Duergar. Schmiedegold, Glut und ein Riese, der Stimmen hört."]
      ],
      endlosName: "Der endlose Raubzug", endlosText: n => "Runde " + n + ": Echo kennt jeden Schatz. Die Plünderer kennen Echo.",
      levelKurz: (g, l) => g + " · Level " + l + "/3", levelEndlos: n => "Endlos · Runde " + n,
      neuFreigeschaltet: "Neu:",
      phase: { raub: "Raubzug", abwehr: "Der Zorn des Hains" },
      raubIntro: "Tippe, um die Ranke zu schleudern. Steine und Tiere ärgern Echo.",
      abwehrIntro: "Tippe auf einen leuchtenden Pflanzplatz, um einen Wächter wachsen zu lassen. Tippe auf die Karte für einen Feuerball.",
      hud: { zorn: "Zorn", gier: "Gier", saat: "Saat", hort: "Hort", genug: "Genug!", wild: "Wildgestalt", feuerball: "Feuerball", gegner: "Plünderer" },
      formen: {
        ranke: ["Ranke", "Zieht alles, nur Felsen nicht."],
        rabe: ["Rabe", "Blitzschnell, aber nur Leichtes."],
        baer: ["Bär", "Zieht alles. Sprengt Felsen."],
        ratte: ["Ratte", "Nagt sich durch Netze."]
      },
      dinge: { muenze: "Münzen", beutel: "Goldbeutel", nugget: "Goldklumpen", edelstein: "Edelstein", stein: "Stein", truhe: "Truhe" },
      res: ["Eicheln", "Gartenkräuter", "Turmmoos", "Leuchtkristalle", "Wurzelholz", "Sporenpilze", "Muscheln", "Feuermoos"],
      relikt: ["Goblin-Krone", "Silberkelch", "Drow-Amulett", "Runenhammer", "Drachenschuppe", "Spinnenidol", "Kuo-Toa-Perle", "Duergar-Krone"],
      ev: {
        naturfrevel: "Die Natur grollt!", gekappt: "Ranke gekappt!", mimik: "Ein Mimik! Hmpf.", zuSchwer: "Zu schwer für den Raben!",
        fels: "Fels! Nur ein Bär …", netz: "Netz! Nur eine Ratte …", wildPlus: "+1 Wildgestalt", keineWild: "Keine Wildgestalt mehr!",
        gier: n => "Gier ×" + n + "!", zeitUm: "Die Dämmerung endet", alles: "Alles geplündert!"
      },
      ausbruch: { feuerball: "FEUERBALL!", blitz: "BLITZ!", baer: "BÄRENWUT!", grummeln: "Hmpf. Echo schmollt.", feuersturm: "FEUERSTURM!" },
      ausbruchTipp: "Der Zorn ist voll. Bei Echo weiß man nie, was jetzt passiert …",
      kommen: n => "Die Plünderer kommen in " + n + " …", jetzt: "Sofort kommen lassen", klaut: n => "−" + n + " Gold",
      bossRuft: { anfuehrer: "Der Goblin-Anführer!", glasstab: "Glasstab, Anführer der Roten Roben!", bugbaer: "Der Bugbear vom Wachturm!", nezna: "Nezna, die Drow!", venomfang: "Venomfang!", vrock: "Ein Vrock!", demogorgon: "DEMOGORGON!", riese: "Der rasende Riese!" },
      demo: { text: "Demogorgon ist nicht zu besiegen. Halte ihn auf, bis er im See versinkt!", weg: "Demogorgon versinkt im See …", schrei: "Sein Schrei lässt die Magie erlöschen!" },
      neznaFlieht: "Nezna wird zur Fledermaus!", gift: "Giftatem!", wurf: "Felswurf!", netzTreffer: "Eingesponnen!", geheimgang: "Geheimgang!",
      wachter: {
        dorn: ["Dornenranke", "Schießt Dornen auf einen Gegner."],
        wurzel: ["Wurzelgriff", "Bremst alle in der Nähe."],
        wolf: ["Wolfsbau", "Die befreiten Wölfe beißen zu."],
        eis: ["Eisfächer", "Frost trifft alle in der Nähe."],
        blitz: ["Sturmeiche", "Blitze springen von Gegner zu Gegner."],
        pilz: ["Pilzring", "Giftsporen für alle in der Nähe."]
      },
      bau: { stufe: n => "Stufe " + n, verstaerken: "▲ Stärker", ausreissen: "✕ Ausreißen", max: "Volle Kraft", waehle: "Welcher Wächter soll hier wachsen?", zuwenig: "Zu wenig Saat", pflanzen: "Pflanzen", stufeVon: n => "Stufe " + n + "/3",
        werte: { schaden: "Schaden", reich: "Reichweite", tempo: "Tempo" }, proSek: n => n + "/s", giftProSek: n => n + "/s Gift",
        spez: {
          dorn: (w, st) => "Ein Ziel: immer das vorderste. Trifft auch Fliegende.",
          wurzel: (w, st) => "Alle in Reichweite · bremst um " + Math.round((1 - w.bremse[st]) * 100) + " %" + (st === 2 ? " · hält fest" : "") + " · Blights sind immun",
          wolf: (w, st) => w.ziele[st] + (w.ziele[st] > 1 ? " Wölfe" : " Wolf") + " · beißt den Nächsten, kommt zurück",
          eis: (w, st) => "Bis zu " + w.ziele[st] + " Splitter · bremst um " + Math.round((1 - w.bremse[st]) * 100) + " %",
          blitz: (w, st) => "Springt auf " + w.ziele[st] + " Ziele, jedes Mal etwas schwächer",
          pilz: (w, st) => w.ziele[st] + " Sporenbälle · vergiften alle im Umkreis für 3 s"
        } },
      gesperrt: "Gesperrt",
      raubFertig: "Der Raubzug ist vorbei",
      raubWerte: { beute: "Beute", gier: "Gier", saat: "Saat", schaetze: "Schätze" },
      gierWarnung: n => n ? "Die Gier lockt " + n + " zusätzliche Plünderer an." : "Noch lockt die Beute niemanden extra an.",
      sicher: "Der Hort ist sicher!", verloren: "Der Hort ist leer!", verlorenText: l => l > 0 ? "Echo verliert ein Leben (" + l + " übrig). Er versucht es noch einmal – grummelnd." : "Echo hat keine Leben mehr.",
      ergWerte: { beutel: "Für den Hain", gesichert: "Gesichertes Gold", gier: "Gierfaktor", erlegt: "Erledigte Plünderer", punkte: "Punkte" },
      hain: "Echos Hain", hainText: "Hier wächst, was Echo stärker macht. Bezahlt wird mit Gold. Er tut es ungern.",
      beutel: n => n + " Gold im Beutel", kaufen: n => n + " Gold", max: "voll",
      hainGruppen: { raub: "Raubzug", wesen: "Gemüt", abwehr: "Abwehr" },
      up: {
        ranke: ["Lange Ranke", "Die Ranke reicht weiter."],
        zug: ["Starke Ranke", "Zieht schneller hoch."],
        zeit: ["Lange Dämmerung", "+6 Sekunden Raubzug."],
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
        heilkraut: ["Heilkräuter", "+1 Leben."]
      },
      leben: n => "❤ " + n,
      endeTitel: "Echos Raubzug endet", sieg: "Die ganze Kampagne geplündert!", siegText: "Alle acht Gebiete. Und Echo will trotzdem mehr. Ab jetzt geht es endlos weiter.",
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
      deinName: "Dein Name", eintragen: "Eintragen", eingetragen: p => "Eingetragen auf Platz " + p + "!", eingetragenOhne: "Eingetragen!",
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
      text: "Echo hurls his vine into the depths, turns into raven, bear or rat and grabs whatever glitters. Then the plunderers come, and the grove must defend the hoard. Eight regions like in our campaign, many levels, even more upgrades.",
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
        ["Gracklstugh", "The fortress of the duergar. Forge gold, embers and a giant who hears voices."]
      ],
      endlosName: "The endless raid", endlosText: n => "Round " + n + ": Echo knows every treasure. The plunderers know Echo.",
      levelKurz: (g, l) => g + " · Level " + l + "/3", levelEndlos: n => "Endless · Round " + n,
      neuFreigeschaltet: "New:",
      phase: { raub: "Raid", abwehr: "Wrath of the grove" },
      raubIntro: "Tap to hurl the vine. Stones and animals annoy Echo.",
      abwehrIntro: "Tap a glowing planting spot to grow a guardian. Tap the map for a fireball.",
      hud: { zorn: "Rage", gier: "Greed", saat: "Seeds", hort: "Hoard", genug: "Enough!", wild: "Wild shape", feuerball: "Fireball", gegner: "Plunderers" },
      formen: {
        ranke: ["Vine", "Pulls anything except boulders."],
        rabe: ["Raven", "Lightning fast, light things only."],
        baer: ["Bear", "Pulls anything. Smashes boulders."],
        ratte: ["Rat", "Gnaws through webs."]
      },
      dinge: { muenze: "Coins", beutel: "Gold pouch", nugget: "Gold nugget", edelstein: "Gem", stein: "Stone", truhe: "Chest" },
      res: ["Acorns", "Garden herbs", "Tower moss", "Glow crystals", "Rootwood", "Spore mushrooms", "Shells", "Fire moss"],
      relikt: ["Goblin crown", "Silver chalice", "Drow amulet", "Rune hammer", "Dragon scale", "Spider idol", "Kuo-toa pearl", "Duergar crown"],
      ev: {
        naturfrevel: "Nature is angry!", gekappt: "Vine cut!", mimik: "A mimic! Hmph.", zuSchwer: "Too heavy for the raven!",
        fels: "Boulder! Only a bear …", netz: "Web! Only a rat …", wildPlus: "+1 wild shape", keineWild: "No wild shapes left!",
        gier: n => "Greed ×" + n + "!", zeitUm: "Dusk is over", alles: "All plundered!"
      },
      ausbruch: { feuerball: "FIREBALL!", blitz: "LIGHTNING!", baer: "BEAR RAGE!", grummeln: "Hmph. Echo sulks.", feuersturm: "FIRESTORM!" },
      ausbruchTipp: "His rage is full. With Echo you never know what happens next …",
      kommen: n => "The plunderers arrive in " + n + " …", jetzt: "Bring them on now", klaut: n => "−" + n + " gold",
      bossRuft: { anfuehrer: "The goblin boss!", glasstab: "Glasstaff, leader of the Redbrands!", bugbaer: "The bugbear of the watchtower!", nezna: "Nezna the drow!", venomfang: "Venomfang!", vrock: "A vrock!", demogorgon: "DEMOGORGON!", riese: "The raging giant!" },
      demo: { text: "Demogorgon cannot be defeated. Hold him off until he sinks back into the lake!", weg: "Demogorgon sinks into the lake …", schrei: "His scream snuffs out all magic!" },
      neznaFlieht: "Nezna turns into a bat!", gift: "Poison breath!", wurf: "Boulder throw!", netzTreffer: "Webbed!", geheimgang: "Secret passage!",
      wachter: {
        dorn: ["Thorn vine", "Shoots thorns at one enemy."],
        wurzel: ["Root grip", "Slows everyone nearby."],
        wolf: ["Wolf den", "The freed wolves bite."],
        eis: ["Ice fan", "Frost hits everyone nearby."],
        blitz: ["Storm oak", "Lightning jumps from foe to foe."],
        pilz: ["Mushroom ring", "Poison spores for everyone nearby."]
      },
      bau: { stufe: n => "Level " + n, verstaerken: "▲ Stronger", ausreissen: "✕ Uproot", max: "Full strength", waehle: "Which guardian shall grow here?", zuwenig: "Not enough seeds", pflanzen: "Plant", stufeVon: n => "Level " + n + "/3",
        werte: { schaden: "Damage", reich: "Range", tempo: "Speed" }, proSek: n => n + "/s", giftProSek: n => n + "/s poison",
        spez: {
          dorn: (w, st) => "One target: always the one in front. Hits flyers too.",
          wurzel: (w, st) => "Everyone in range · slows by " + Math.round((1 - w.bremse[st]) * 100) + " %" + (st === 2 ? " · roots them" : "") + " · blights are immune",
          wolf: (w, st) => w.ziele[st] + (w.ziele[st] > 1 ? " wolves" : " wolf") + " · bites the nearest, comes back",
          eis: (w, st) => "Up to " + w.ziele[st] + " shards · slows by " + Math.round((1 - w.bremse[st]) * 100) + " %",
          blitz: (w, st) => "Jumps to " + w.ziele[st] + " targets, a little weaker each time",
          pilz: (w, st) => w.ziele[st] + " spore balls · poison everyone nearby for 3 s"
        } },
      gesperrt: "Locked",
      raubFertig: "The raid is over",
      raubWerte: { beute: "Loot", gier: "Greed", saat: "Seeds", schaetze: "Treasures" },
      gierWarnung: n => n ? "Greed lures " + n + " extra plunderers." : "The loot doesn't lure anyone extra yet.",
      sicher: "The hoard is safe!", verloren: "The hoard is empty!", verlorenText: l => l > 0 ? "Echo loses a life (" + l + " left). He tries again – grumbling." : "Echo has no lives left.",
      ergWerte: { beutel: "For the grove", gesichert: "Gold secured", gier: "Greed factor", erlegt: "Plunderers stopped", punkte: "Points" },
      hain: "Echo's grove", hainText: "Here grows what makes Echo stronger. Paid for in gold. He does it reluctantly.",
      beutel: n => n + " gold in the pouch", kaufen: n => n + " gold", max: "maxed",
      hainGruppen: { raub: "Raid", wesen: "Temper", abwehr: "Defence" },
      up: {
        ranke: ["Long vine", "The vine reaches further."],
        zug: ["Strong vine", "Pulls up faster."],
        zeit: ["Long dusk", "+6 seconds of raiding."],
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
        heilkraut: ["Healing herbs", "+1 life."]
      },
      leben: n => "❤ " + n,
      endeTitel: "Echo's raid ends", sieg: "The whole campaign plundered!", siegText: "All eight regions. And Echo still wants more. From now on it goes on endlessly.",
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
      deinName: "Your name", eintragen: "Enter", eingetragen: p => "Entered at rank " + p + "!", eingetragenOhne: "Entered!",
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
  const LEVEL_PRO_GEBIET = 3, GEBIETE_ANZAHL = 8, KAMPAGNE = GEBIETE_ANZAHL * LEVEL_PRO_GEBIET;

  const STUFEN = {
    lehrling:  { zeit: 1.18, hp: 0.78, zorn: 0.8, leben: 4, tempo: 0.92 },
    druide:    { zeit: 1, hp: 1, zorn: 1, leben: 3, tempo: 1 },
    erzdruide: { zeit: 0.88, hp: 1.3, zorn: 1.2, leben: 2, tempo: 1.08 }
  };
  let stufeWahl = STUFEN[lies("imres-echohort-stufe", "")] ? lies("imres-echohort-stufe", "") : "druide";

  /* Gebiete: Farben, Ressource, Tiere, Störenfriede, Gegner, Boss */
  const GEB = [
    { k: "wald", relikt: "krone", tier: "hase", stoerer: "wespe", gegner: [["goblin", 1]], boss: "anfuehrer",
      f: { himmel: ["#0c1110", "#1a2620"], boden: ["#2a2117", "#16110c"], akzent: "#4d6b35", stein: "#5d574c", res: "#a8783e", weg: "#4a3a26", gras: "#1d2a1a" } },
    { k: "phandalin", relikt: "kelch", tier: "hase", stoerer: "wespe", gegner: [["goblin", 0.3], ["rotrobe", 0.7]], boss: "glasstab",
      f: { himmel: ["#120d10", "#2a1a1a"], boden: ["#2b221c", "#151010"], akzent: "#9b3a2f", stein: "#625a52", res: "#6f8a5a", weg: "#57483a", gras: "#232a1c", mauer: true } },
    { k: "wachturm", relikt: "amulett", tier: "fledermaus", stoerer: "spinne", gegner: [["goblin", 0.55], ["bandit", 0.45]], boss: "bugbaer",
      f: { himmel: ["#0c0c14", "#1c1c28"], boden: ["#26252a", "#121216"], akzent: "#6a6a86", stein: "#5a5866", res: "#5f8a4a", weg: "#3b3a40", gras: "#1d221c", mauer: true } },
    { k: "schmiede", relikt: "hammer", tier: "fledermaus", stoerer: "spinne", gegner: [["soeldner", 0.6], ["goblin", 0.25], ["bugbear", 0.15]], boss: "nezna",
      f: { himmel: ["#0d0b0a", "#1e1712"], boden: ["#2d241b", "#120e0a"], akzent: "#e0a046", stein: "#5b5249", res: "#7fd6e0", weg: "#3d3024", gras: "#221b14", schienen: true } },
    { k: "donnerbaum", relikt: "schuppe", tier: "hase", stoerer: "spinne", gegner: [["blight", 0.55], ["zombie", 0.3], ["spinne", 0.15]], boss: "venomfang",
      f: { himmel: ["#0b100c", "#18231a"], boden: ["#231d16", "#100c09"], akzent: "#6f9a3a", stein: "#55524a", res: "#8a6440", weg: "#3d3324", gras: "#1a2416" } },
    { k: "unterreich", relikt: "idol", tier: "fledermaus", stoerer: "spinne", gegner: [["drow", 0.45], ["ettercap", 0.3], ["chasme", 0.25]], boss: "vrock",
      f: { himmel: ["#07060c", "#120f1c"], boden: ["#1b1724", "#0b0910"], akzent: "#8a6ad0", stein: "#4a4458", res: "#c49ae0", weg: "#2b2536", gras: "#161320", pilze: true } },
    { k: "see", relikt: "perle", tier: "fisch", stoerer: "aal", gegner: [["kuotoa", 1]], boss: "demogorgon",
      f: { himmel: ["#06090e", "#0e1824"], boden: ["#0f2230", "#06101a"], akzent: "#4aa0b0", stein: "#3d4c58", res: "#e8c8b0", weg: "#2a3a44", gras: "#10202a", wasser: true } },
    { k: "gracklstugh", relikt: "krone", tier: "fledermaus", stoerer: "spinne", gegner: [["duergar", 0.75], ["bugbear", 0.25]], boss: "riese",
      f: { himmel: ["#0e0808", "#24120c"], boden: ["#2a1a14", "#120a08"], akzent: "#e0602a", stein: "#584a44", res: "#ff8a3a", weg: "#3a2a22", gras: "#22140f", lava: true } }
  ];

  /* Gegner der Abwehr. hp/tempo/klau werden mit dem Level hochskaliert. */
  const FEINDE = {
    goblin:   { hp: 30, v: 44, klau: 8, r: 8, pkt: 5, farbe: "#6b7d3e" },
    rotrobe:  { hp: 62, v: 36, klau: 12, r: 9, pkt: 8, farbe: "#8a2f26" },
    bandit:   { hp: 56, v: 38, klau: 12, r: 9, pkt: 8, farbe: "#6b4a30" },
    bugbear:  { hp: 175, v: 26, klau: 25, r: 12, pkt: 20, farbe: "#a8783e" },
    soeldner: { hp: 96, v: 32, klau: 15, r: 10, pkt: 10, farbe: "#7a7f86" },
    zombie:   { hp: 155, v: 17, klau: 15, r: 10, pkt: 10, farbe: "#6a7a5c" },
    blight:   { hp: 36, v: 50, klau: 6, r: 7, pkt: 5, farbe: "#5a4630", feuerSchwach: true, wurzelFest: true },
    spinne:   { hp: 88, v: 42, klau: 10, r: 10, pkt: 10, farbe: "#2a2226", netz: true },
    drow:     { hp: 102, v: 36, klau: 14, r: 9, pkt: 12, farbe: "#3b2f4a", ausweichen: 0.2 },
    ettercap: { hp: 122, v: 30, klau: 12, r: 10, pkt: 12, farbe: "#58505a", netz: true },
    chasme:   { hp: 130, v: 36, klau: 20, r: 11, pkt: 15, farbe: "#3a4560", flug: true },
    kuotoa:   { hp: 126, v: 31, klau: 15, r: 10, pkt: 12, farbe: "#3f7a78" },
    duergar:  { hp: 165, v: 30, klau: 18, r: 10, pkt: 14, farbe: "#6a6460", unsichtbar: true },
    // Bosse
    anfuehrer: { hp: 430, v: 24, klau: 60, r: 15, pkt: 100, farbe: "#5d6e35", boss: true, ruft: "goblin" },
    glasstab:  { hp: 580, v: 22, klau: 70, r: 14, pkt: 120, farbe: "#9b3a2f", boss: true, blinzeln: true },
    bugbaer:   { hp: 950, v: 20, klau: 80, r: 17, pkt: 150, farbe: "#a8783e", boss: true, bild: "bugbear.jpg", bildY: 0.3 },
    nezna:     { hp: 920, v: 28, klau: 80, r: 14, pkt: 160, farbe: "#4a3a66", boss: true, verwandeln: true },
    venomfang: { hp: 1550, v: 19, klau: 110, r: 20, pkt: 220, farbe: "#4d7a3a", boss: true, bild: "venomfang.jpg", bildY: 0.32, gift: true },
    vrock:     { hp: 1500, v: 26, klau: 110, r: 18, pkt: 220, farbe: "#8a8070", boss: true, bild: "vrock.jpg", bildY: 0.28, flug: true },
    demogorgon:{ hp: 1, v: 8.5, klau: 99999, r: 24, pkt: 500, farbe: "#9b3a2f", boss: true, bild: "demogorgon-karte.webp", bildY: 0.3, unbesiegbar: true, schrei: true },
    riese:     { hp: 2500, v: 13, klau: 220, r: 22, pkt: 350, farbe: "#7a6a5a", boss: true, bild: "portrait-riese.jpg", bildY: 0.5, wurf: true }
  };

  /* Wächter (Türme). ab = ab welchem Level (Index) verfügbar */
  const WACHTER = {
    dorn:   { ab: 0,  sym: "🌿", kosten: [30, 35, 55], reich: [74, 82, 92], schaden: [10, 17, 27], rate: 0.6, typ: "schuss", farbe: "#6f9a3a" },
    wurzel: { ab: 0,  sym: "🌳", kosten: [35, 40, 55], reich: [62, 68, 76], schaden: [5, 8, 12], rate: 1.7, typ: "puls", bremse: [0.55, 0.45, 0.32], bremsT: 1.6, farbe: "#8a6440" },
    wolf:   { ab: 2,  sym: "🐺", kosten: [45, 50, 65], reich: [58, 62, 68], schaden: [32, 50, 74], rate: 1.05, typ: "biss", ziele: [1, 1, 2], farbe: "#a89f8f" },
    eis:    { ab: 6,  sym: "❄️", kosten: [50, 55, 75], reich: [74, 80, 88], schaden: [15, 24, 35], rate: 2.1, typ: "puls", bremse: [0.6, 0.5, 0.4], bremsT: 2, ziele: [4, 6, 8], farbe: "#9fd6ec" },
    blitz:  { ab: 9,  sym: "⚡", kosten: [70, 75, 95], reich: [104, 114, 124], schaden: [44, 62, 88], rate: 2.3, typ: "kette", ziele: [2, 3, 4], farbe: "#f3e27a" },
    pilz:   { ab: 15, sym: "🍄", kosten: [45, 55, 75], reich: [64, 70, 78], schaden: [10, 16, 24], rate: 1.8, typ: "gift", ziele: [2, 3, 4], farbe: "#c49ae0" }
  };
  const WACHTER_REIHE = ["dorn", "wurzel", "wolf", "eis", "blitz", "pilz"];

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
    baerenkraft: { gruppe: "abwehr", sym: "🐻", kosten: [180, 380] }
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
  const skalierung = lv => 1 + 0.14 * Math.min(lv, KAMPAGNE) + (lv >= KAMPAGNE ? 0.2 * (lv - KAMPAGNE + 1) : 0);
  function neueFreischaltungen(lv) {
    const n = [];
    FORMEN_REIHE.forEach(k => { if (FORMEN[k].ab === lv && lv > 0) n.push(FORMEN[k].sym + " " + t().formen[k][0]); });
    WACHTER_REIHE.forEach(k => { if (WACHTER[k].ab === lv && lv > 0) n.push(WACHTER[k].sym + " " + t().wachter[k][0]); });
    return n;
  }

  /* ---------- Klang (eigene Synthese, keine Dateien) ---------- */
  let ac = null, rauschen = null, tonAn = lies("imres-echohort-ton", "1") === "1";
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
  function knistern(dauer, laut, typ, freq, verz) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const q = a.createBufferSource(); q.buffer = rauschen;
    const b = a.createBiquadFilter(); b.type = typ; b.frequency.value = freq;
    q.connect(b); b.connect(huelle(a, a.destination, t0, laut, dauer));
    q.start(t0, Math.random() * 0.5); q.stop(t0 + dauer + 0.05);
  }
  let letzterKlang = {};
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
    verwandeln: () => { knistern(0.3, 0.1, "bandpass", 600); ton("sine", 300, 900, 0.3, 0.06); }
  };

  /* ---------- Spielzustand ---------- */
  let zustand = "start"; // start | spiel | tafel | pause | ende
  let S = null;
  const SPEICHER = "imres-echohort-spiel";
  const up = k => (S && S.up[k]) || 0;
  const zornFaktor = () => STUFEN[S.stufe].zorn * (1 - 0.15 * up("grummeln"));

  function neuesSpiel() {
    S = {
      stufe: stufeWahl, lv: 0, leben: STUFEN[stufeWahl].leben, punkte: 0, beutel: 0,
      goldGesamt: 0, erlegtGesamt: 0, schaetzeGesamt: 0, up: {}, phase: "raub", tafel: "", R: null, A: null, erg: null
    };
  }
  function speichern() {
    if (!S) return;
    const k = { stufe: S.stufe, lv: S.lv, leben: S.leben, punkte: S.punkte, beutel: S.beutel, goldGesamt: S.goldGesamt, erlegtGesamt: S.erlegtGesamt, schaetzeGesamt: S.schaetzeGesamt, up: S.up };
    schreib(SPEICHER, JSON.stringify(k));
  }
  function gespeichert() {
    try { const v = JSON.parse(lies(SPEICHER, "null")); return v && STUFEN[v.stufe] && typeof v.lv === "number" ? v : null; } catch (_) { return null; }
  }
  function laden(k) {
    neuesSpiel();
    Object.assign(S, k);
    S.up = Object.assign({}, k.up || {});
  }

  /* gemeinsame Effekte für beide Phasen */
  function text(x, y, s, farbe, gross, dauer) { S.texte.push({ x, y, s, farbe: farbe || "#ebe2cc", gross: gross || 15, t: 0, dauer: dauer || 1.3 }); }
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
    const zeit = (40 + 6 * up("zeit")) * STUFEN[S.stufe].zeit;
    S.phase = "raub";
    S.texte = []; S.teilchen = []; S.banner = null; S.quip = null; S.quipT = 0; S.blitze = [];
    S.R = {
      g, zeit, zeitMax: zeit, dinge: dingeErzeugen(lv), zorn: 0, beute: 0, saat: 0, gier: 0, schaetze: 0,
      form: "ranke", formWuerfe: 0, wild: 2 + up("wild"), schmollT: 0, schwingT: Math.random() * 3,
      haken: { zustand: "schwingen", winkel: 0, laenge: 18, last: null }, endeWunsch: false, fertig: false, endeT: 0,
      ausbrueche: 0, gierSchritt: 130 + 24 * Math.min(lv, KAMPAGNE + 12)
    };
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
    h.zustand = "raus"; h.laenge = 18;
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
    R.zorn = Math.max(0, R.zorn - dt * 2.2);
    // Tiere und Störenfriede bewegen sich
    R.dinge.forEach(d => {
      if (d.typ === "tier") {
        if (d.flieht) { d.x += d.v * 5 * dt; d.y -= 30 * dt; d.alpha = (d.alpha == null ? 1 : d.alpha) - dt * 1.5; return; }
        d.ph += dt * 4; d.x += d.v * dt; d.y = d.by + (d.art === "fledermaus" ? Math.sin(d.ph) * 10 : d.art === "fisch" ? Math.sin(d.ph * 0.6) * 5 : -Math.abs(Math.sin(d.ph)) * 6);
        if (d.x < 20 || d.x > W - 20) { d.v *= -1; d.x = klemm(d.x, 20, W - 20); }
      } else if (d.typ === "stoerer") {
        d.ph += dt;
        if (d.art === "spinne") { d.y = d.by + Math.sin(d.ph * 1.3) * 70; d.y = klemm(d.y, 140, 430); }
        else { d.x += d.v * dt; d.y = d.by + Math.sin(d.ph * 5) * (d.art === "aal" ? 6 : 12); if (d.x < 20 || d.x > W - 20) { d.v *= -1; d.x = klemm(d.x, 20, W - 20); } }
      }
    });
    R.dinge = R.dinge.filter(d => !(d.typ === "tier" && d.flieht && d.alpha <= 0));
    // Haken
    const f = formDaten();
    if (h.zustand === "schwingen") {
      R.schwingT += dt * (R.form === "rabe" ? 1.25 : R.form === "baer" ? 0.85 : 1);
      h.winkel = Math.sin(R.schwingT * 1.7) * 1.22;
      if (R.endeWunsch && !R.fertig) raubzugEnde();
    } else if (h.zustand === "raus") {
      h.laenge += 300 * f.schuss * dt;
      const sp = hakenSpitze(h);
      if (sp.x < 6 || sp.x > W - 6 || sp.y > LEISTE - 6 || h.laenge > reichweite()) { h.zustand = "rein"; zornDazu(2.5); return; }
      for (const d of R.dinge) {
        if (d.flieht) continue;
        if (abst(sp.x, sp.y, d.x, d.y) > d.r + 5) continue;
        treffeDing(d, sp); break;
      }
    } else if (h.zustand === "rein") {
      const last = h.last;
      const v = last ? 250 * f.zug * (1 + 0.18 * up("zug")) / (0.55 + last.gewicht * 0.42) : 560;
      h.laenge -= v * dt;
      if (last) { const sp = hakenSpitze(h); last.x = sp.x; last.y = sp.y + last.r * 0.6; }
      if (h.laenge <= 18) {
        h.laenge = 18; h.zustand = "schwingen";
        if (last) { h.last = null; einsammeln(last); }
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
    h.last = d; h.zustand = "rein"; KLANG.griff();
  }

  function einsammeln(d) {
    const R = S.R, T = t(), x = DREH.x, y = DREH.y + 20;
    if (d.typ === "stein") {
      R.beute += d.wert; text(x + 30, y, "+" + d.wert, "#a89f8f", 14); KLANG.stein(); quip("stein", 0.55); zornDazu(13); return;
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
    if (d.typ === "relikt") text(W / 2, 150, T.relikt[R.g] + "!", "#ffd34d", 20, 1.8);
    quip("gold", 0.3);
    const g = Math.min(5, Math.floor(R.beute / R.gierSchritt));
    if (g > R.gier) { R.gier = g; banner(T.ev.gier(g), "#ffd34d", 1.4); }
  }

  function ausbruchRaub() {
    const R = S.R, T = t();
    R.zorn = 25; R.ausbrueche++;
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

  function raubzugEnde() {
    const R = S.R; if (R.fertig) return;
    R.fertig = true;
    S.schaetzeGesamt += R.schaetze;
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
    let roh = PFADE[lv < KAMPAGNE ? (lv + gebietVon(lv)) % PFADE.length : Math.floor(Math.random() * PFADE.length)];
    if (gebietVon(lv) % 2 === 1) roh = roh.map(([x, y]) => [W - x, y]);
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
  function plaetzeBauen(P) {
    const l = [];
    let seite = 1;
    for (let s = 34; s < P.gesamt - 30; s += 30) {
      const a = pfadPunkt(P, s), b = pfadPunkt(P, s + 4), w = Math.atan2(b.y - a.y, b.x - a.x);
      for (const sd of [seite, -seite]) {
        const x = a.x + Math.cos(w + Math.PI / 2) * 40 * sd, y = a.y + Math.sin(w + Math.PI / 2) * 40 * sd;
        if (x < 24 || x > W - 24 || y < 50 || y > LEISTE - 26) continue;
        if (abstZumPfad(P, x, y) < 31) continue;
        if (abst(x, y, HORT.x, HORT.y) < 52) continue;
        if (l.some(q => abst(q.x, q.y, x, y) < 50)) continue;
        l.push({ x, y, turm: null }); seite = -seite; break;
      }
    }
    return l.slice(0, 11);
  }

  function gegnerListe(lv, gier) {
    const g = gebietVon(lv), G = GEB[g], innen = innenVon(lv);
    let n = Math.round((8 + lv * 0.9 + innen * 2 + gier * 2) * (lv >= KAMPAGNE ? 1.15 : 1));
    const l = [];
    const typ = () => { let r = Math.random(); for (const [k, w] of G.gegner) { r -= w; if (r <= 0) return k; } return G.gegner[0][0]; };
    const boss = istBossLevel(lv);
    if (boss) n = Math.round(n * 0.7);
    for (let i = 0; i < n; i++) l.push(typ());
    if (lv >= KAMPAGNE) { // endlos: ein paar Gäste aus anderen Gebieten
      for (let i = 0; i < Math.min(8, 2 + (lv - KAMPAGNE)); i++) l.push(zufall(GEB[Math.floor(Math.random() * GEBIETE_ANZAHL)].gegner)[0]);
      mischen(l);
    }
    if (boss) {
      const b = lv < KAMPAGNE ? G.boss : zufall(["anfuehrer", "glasstab", "bugbaer", "nezna", "venomfang", "vrock", "riese"]);
      if (b === "demogorgon") return { liste: l, boss: b, demo: true };
      l.splice(Math.floor(l.length * 0.6), 0, b);
      return { liste: l, boss: b };
    }
    return { liste: l };
  }

  function abwehrStarten() {
    const R = S.R, lv = S.lv, g = gebietVon(lv);
    const P = pfadBauen(lv);
    const gl = gegnerListe(lv, R.gier);
    const reserve = 20 + 30 * up("notgroschen");
    S.phase = "abwehr";
    S.texte = []; S.teilchen = []; S.banner = null; S.blitze = []; S.quip = null; S.quipT = 0;
    S.A = {
      g, P, plaetze: plaetzeBauen(P), feinde: [], geschosse: [], effekte: [],
      hort: R.beute + reserve, reserve, hortStart: R.beute + reserve,
      saat: 30 + 15 * up("ernte") + R.saat, zorn: 0, feuerCd: 0, feuerMax: 9 * Math.pow(0.85, up("funken")),
      warte: gl.liste.slice(), boss: gl.boss || null, demo: !!gl.demo, demoT: 0, demoDauer: 70, demoWeg: false,
      spawnT: 0, abstand: Math.max(0.7, 1.75 - lv * 0.035), gespawnt: 0,
      vorT: 9, wahl: -1, baer: null, erlegt: 0, punkte: 0, gesamt: gl.liste.length + (gl.demo ? 1 : 0), lv, fertig: false, endeT: 0, bossGerufen: false
    };
    if (S.A.demo) S.A.gesamt = gl.liste.length;
    hintergrundAbwehr(g, P);
  }

  function feindNeu(typ, s) {
    const A = S.A, d = FEINDE[typ], lv = S.lv;
    const hpF = (d.boss ? 1 + 0.07 * lv : skalierung(lv)) * STUFEN[S.stufe].hp;
    const e = {
      typ, d, hp: d.hp * hpF, max: d.hp * hpF, v: d.v * STUFEN[S.stufe].tempo * (1 + Math.min(0.25, lv * 0.008)), r: d.r,
      s: s || 0, x: 0, y: 0, flug: !!d.flug, bremse: 1, bremsT: 0, festT: 0, gift: 0, giftT: 0,
      cd: 3 + Math.random() * 2, unsT: 0, unsichtbarZyklus: Math.random() * 4, ph: Math.random() * 6, treffT: 0, verwandelt: false, tot: false
    };
    if (e.flug) {
      const st = pfadPunkt(A.P, 0);
      e.x = klemm(st.x + zw(-120, 120), 30, W - 30); e.y = 20;
    } else { const q = pfadPunkt(A.P, e.s); e.x = q.x; e.y = q.y; }
    if (d.unbesiegbar) e.v = A.P.gesamt / 50 * STUFEN[S.stufe].tempo;
    if (d.boss) {
      text(W / 2, 180, t().bossRuft[typ] || "", "#c4564a", 22, 2.2);
      banner(t().bossRuft[typ] || "", "#c4564a", 2.2);
      KLANG.boss(); quip("boss", 1);
      if (typ === "demogorgon") { A.demoT = 0; text(W / 2, 220, t().demo.text, "#ebe2cc", 14, 4); }
    }
    A.feinde.push(e);
    return e;
  }

  function abwehrUpdate(dt) {
    const A = S.A;
    if (S.quipT > 0) S.quipT -= dt;
    A.feuerCd = Math.max(0, A.feuerCd - dt);
    A.zorn = Math.max(0, A.zorn - dt * 1.2);
    if (A.fertig) { A.endeT += dt; if (A.endeT > 1.1 && zustand === "spiel") ergebnisZeigen(); return; }
    // Vorbereitung
    if (A.vorT > 0) { A.vorT -= dt; if (A.vorT <= 0) { A.vorT = 0; KLANG.boss(); } }
    else {
      // Gegner kommen
      A.spawnT -= dt;
      if (A.warte.length && A.spawnT <= 0) {
        const typ = A.warte.shift();
        feindNeu(typ);
        A.gespawnt++;
        A.spawnT = A.abstand * (A.gespawnt % 8 === 0 ? 2.6 : 1) * zw(0.75, 1.25);
      }
      if (A.demo) {
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
    // Gegner bewegen
    A.feinde.forEach(e => feindBewegen(e, dt));
    A.feinde = A.feinde.filter(e => !e.tot);
    // Wächter
    A.plaetze.forEach(p => { if (p.turm) turmUpdate(p, dt); });
    // Geschosse
    A.geschosse.forEach(g => {
      g.t += dt;
      if (g.art === "dorn") {
        const z = g.ziel;
        if (!z || z.tot) { g.weg = true; return; }
        const dx = z.x - g.x, dy = z.y - g.y, d = Math.hypot(dx, dy), sch = 340 * dt;
        if (d <= sch + z.r) { treffen(z, g.schaden, "schuss"); g.weg = true; return; }
        g.x += dx / d * sch; g.y += dy / d * sch; g.w = Math.atan2(dy, dx);
      } else if (g.art === "splitter") {
        const z = g.ziel;
        if (!z || z.tot) { g.weg = true; funken(g.x, g.y, 3, ["#cfeaf4", "#ffffff"], 40, 1.5); return; }
        const dx = z.x - g.x, dy = z.y - g.y, d = Math.hypot(dx, dy), sch = 420 * dt;
        if (d <= sch + z.r) {
          treffen(z, g.schaden, "frost");
          if (!z.tot) { z.bremse = Math.min(z.bremse, g.bremse); z.bremsT = Math.max(z.bremsT, g.bremsT); }
          funken(z.x, z.y, 5, ["#cfeaf4", "#9fd6ec", "#ffffff"], 60, 2); g.weg = true; return;
        }
        g.x += dx / d * sch; g.y += dy / d * sch; g.w = Math.atan2(dy, dx); g.dreh = (g.dreh || 0) + dt * 14;
      } else if (g.art === "spore") {
        const u = Math.min(1, g.t / g.dauer);
        g.x = g.x0 + (g.x1 - g.x0) * u; g.y = g.y0 + (g.y1 - g.y0) * u - Math.sin(u * Math.PI) * 34;
        if (u >= 1) {
          g.weg = true;
          imKreis(g.x1, g.y1, 28).forEach(e => { e.gift = Math.max(e.gift, g.schaden); e.giftT = 3; });
          S.blitze.push({ art: "sporenwolke", x: g.x1, y: g.y1, r: 28, t: 0, dauer: 0.9 });
          KLANG.sporen();
        }
      } else if (g.art === "wolf") {
        const heim = g.heim, v = 290 * dt;
        if (g.zustand === "hin") {
          let z = g.ziel;
          if (!z || z.tot) { z = g.ziel = imKreis(heim.x, heim.y, g.reich + 20).sort((a, b) => abst(g.x, g.y, a.x, a.y) - abst(g.x, g.y, b.x, b.y))[0]; }
          if (!z) { g.zustand = "zurueck"; return; }
          const dx = z.x - g.x, dy = z.y - g.y, d = Math.hypot(dx, dy);
          g.links = dx < 0;
          if (d <= v + z.r + 4) {
            treffen(z, g.schaden, "biss");
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
    // Ende?
    if (A.hort <= 0) { A.hort = 0; A.fertig = true; A.verloren = true; A.endeT = 0; return; }
    if (A.vorT <= 0 && !A.warte.length && !A.feinde.length && (!A.demo || A.demoWeg)) { A.fertig = true; A.verloren = false; A.endeT = 0; KLANG.sieg(); banner(t().sicher, "#e0a046", 2); }
  }

  function feindBewegen(e, dt) {
    const A = S.A, d = e.d;
    e.ph += dt; e.treffT = Math.max(0, e.treffT - dt);
    if (e.bremsT > 0) { e.bremsT -= dt; if (e.bremsT <= 0) e.bremse = 1; }
    if (e.giftT > 0) { e.giftT -= dt; treffen(e, e.gift * dt, "gift", true); if (e.tot) return; }
    // Fähigkeiten
    e.cd -= dt;
    if (d.unsichtbar) { e.unsichtbarZyklus += dt; e.unsT = (e.unsichtbarZyklus % 5.5) > 3.7 ? 1 : 0; }
    if (e.cd <= 0) {
      if (d.ruft) { e.cd = 6; for (let i = 0; i < 2; i++) { const n = feindNeu(d.ruft, Math.max(0, e.s - 10 - i * 14)); A.gesamt++; n.v *= 1.1; } funken(e.x, e.y, 10, ["#6b7d3e", "#ebe2cc"], 60); }
      else if (d.blinzeln) { e.cd = 5; funken(e.x, e.y, 14, ["#8a6ad0", "#c49ae0"], 70); e.s = Math.min(A.P.gesamt - 30, e.s + 55); if (!A.blinzelText) { A.blinzelText = true; text(e.x, e.y - 24, t().geheimgang, "#c49ae0", 15); } KLANG.puff(); }
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
    if (e.festT > 0) { e.festT -= dt; v = d.boss ? v * 0.5 : 0; }
    if (d.unbesiegbar) v = Math.max(v, e.v * 0.35);
    if (e.flug) {
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
    e.tot = true;
    const k = Math.min(A.hort, Math.round(Math.max(e.d.klau * (1 + 0.04 * Math.min(S.lv, KAMPAGNE)), A.hortStart * (e.d.boss ? 0.22 : 0.045))));
    A.hort -= k;
    text(HORT.x + zw(-30, 30), HORT.y - 30, t().klaut(k), "#c4564a", 16);
    funken(HORT.x, HORT.y - 6, 10, ["#e0a046", "#ffd34d"], 90);
    KLANG.klau();
    A.zorn = klemm(A.zorn + Math.min(40, k * 0.6) * zornFaktor(), 0, 100);
    if (A.zorn >= 100) ausbruchAbwehr();
  }

  function treffen(e, schaden, art, still) {
    if (e.tot) return;
    const d = e.d, A = S.A;
    if (d.unbesiegbar) { if (!still && Math.random() < 0.15) funken(e.x, e.y, 3, ["#9fd6ec"], 40); return; }
    if (d.ausweichen && (art === "schuss" || art === "biss" || art === "kette") && Math.random() < d.ausweichen) { if (!still) text(e.x, e.y - 14, "!", "#c49ae0", 14, 0.6); return; }
    if (art === "feuer" && d.feuerSchwach) schaden *= 2;
    e.hp -= schaden; if (!still) e.treffT = 0.12;
    if (e.hp <= 0) {
      e.tot = true; A.erlegt++; S.erlegtGesamt++;
      A.punkte += d.pkt;
      const saat = Math.round(d.pkt * 0.5) + 1;
      A.saat += saat;
      if (d.boss) { text(e.x, e.y - 20, "+" + d.pkt, "#ffd34d", 22); funken(e.x, e.y, 40, ["#e0a046", "#c4564a", "#ebe2cc"], 150, 3.5); KLANG.boom(); S.beben = 0.4; }
      else { funken(e.x, e.y, 8, [d.farbe, "#ebe2cc"], 70); text(e.x, e.y - 10, "+" + saat + " 🌱", "#cfe6a8", 11, 0.9); KLANG.tod(); }
    }
  }

  function sichtbarFuer(e) { return !e.tot && !e.unsT; }
  function imKreis(x, y, r) { return S.A.feinde.filter(e => sichtbarFuer(e) && abst(x, y, e.x, e.y) <= r + e.r); }

  function turmUpdate(p, dt) {
    const T = p.turm, w = WACHTER[T.k], st = T.st;
    T.anim = Math.max(0, (T.anim || 0) - dt);
    if (T.netz) T.netz = Math.max(0, T.netz - dt);
    if (T.ausT > 0) { T.ausT -= dt; return; }
    T.cd -= dt; if (T.cd > 0) return;
    const reich = w.reich[st], sch = w.schaden[st] * (1 + 0.045 * Math.min(S.lv, KAMPAGNE + 10));
    const ziele = imKreis(p.x, p.y, reich);
    if (!ziele.length) { T.cd = 0.1; return; }
    const vorne = l => l.slice().sort((a, b) => fortschritt(b) - fortschritt(a));
    if (w.typ === "biss" && (T.draussen || 0) > 0) { T.cd = 0.1; return; }
    T.cd = w.rate; T.anim = 0.3;
    if (w.typ === "schuss") {
      const z = vorne(ziele)[0];
      T.winkel = Math.atan2(z.y - (p.y - 12), z.x - p.x);
      S.A.geschosse.push({ art: "dorn", x: p.x + Math.cos(T.winkel) * 10, y: p.y - 12 + Math.sin(T.winkel) * 10, ziel: z, schaden: sch, t: 0, w: T.winkel, st });
      KLANG.dorn();
    } else if (T.k === "wurzel") {
      ziele.forEach(e => {
        treffen(e, sch, "wurzel", true);
        S.blitze.push({ art: "wurzelstich", x: e.x, y: e.y, t: 0, dauer: 0.55, seed: Math.random() });
        if (e.d.wurzelFest) return;
        e.bremse = Math.min(e.bremse, w.bremse[st]); e.bremsT = Math.max(e.bremsT, w.bremsT);
        if (st === 2) e.festT = Math.max(e.festT, 0.5);
      });
      S.blitze.push({ art: "ring", x: p.x, y: p.y + 4, r: reich, t: 0, dauer: 0.5 });
      KLANG.wurzel();
    } else if (T.k === "eis") {
      vorne(ziele).slice(0, w.ziele[st]).forEach((e, i) => {
        const a = -Math.PI / 2 + (i - (w.ziele[st] - 1) / 2) * 0.5;
        S.A.geschosse.push({ art: "splitter", x: p.x + Math.cos(a) * 6, y: p.y - 16 + Math.sin(a) * 6, ziel: e, schaden: sch, bremse: w.bremse[st], bremsT: w.bremsT, t: 0, w: a, dreh: 0 });
      });
      S.blitze.push({ art: "frost", x: p.x, y: p.y - 6, r: 24, t: 0, dauer: 0.35 });
      KLANG.frost();
    } else if (w.typ === "biss") {
      ziele.sort((a, b) => abst(p.x, p.y, a.x, a.y) - abst(p.x, p.y, b.x, b.y)).slice(0, w.ziele[st]).forEach(e => {
        T.draussen = (T.draussen || 0) + 1;
        S.A.geschosse.push({ art: "wolf", x: p.x, y: p.y + 2, heim: { x: p.x, y: p.y + 2 }, reich, ziel: e, schaden: sch, zustand: "hin", turm: T, t: 0, links: e.x < p.x });
      });
      KLANG.biss();
    } else if (w.typ === "kette") {
      let z = vorne(ziele)[0], x0 = p.x, y0 = p.y - 30 - st * 2, s = sch;
      const gehabt = new Set();
      for (let i = 0; i < w.ziele[st] && z; i++) {
        gehabt.add(z);
        S.blitze.push({ art: "blitz", x1: x0, y1: y0, x2: z.x, y2: z.y, t: 0, dauer: 0.3, seed: Math.random() });
        treffen(z, s, "kette");
        funken(z.x, z.y, 4, ["#f3e27a", "#ffffff"], 60, 1.6);
        x0 = z.x; y0 = z.y; s *= 0.8;
        z = S.A.feinde.filter(e => sichtbarFuer(e) && !gehabt.has(e) && abst(x0, y0, e.x, e.y) < 85).sort((a, b) => abst(x0, y0, a.x, a.y) - abst(x0, y0, b.x, b.y))[0];
      }
      KLANG.blitz();
    } else if (w.typ === "gift") {
      vorne(ziele).slice(0, w.ziele[st]).forEach((e, i) => {
        const vor = e.flug ? { x: e.x, y: e.y } : pfadPunkt(S.A.P, e.s + e.v * e.bremse * 0.55);
        S.A.geschosse.push({ art: "spore", x0: p.x + (i - 1) * 5, y0: p.y - 10, x1: vor.x, y1: vor.y, x: p.x, y: p.y - 10, t: 0, dauer: 0.55, schaden: sch });
      });
    }
  }
  const fortschritt = e => e.flug ? 1000 - abst(e.x, e.y, HORT.x, HORT.y) : e.s;

  function giftAtem(e) {
    const A = S.A;
    A.plaetze.forEach(p => { if (p.turm && abst(p.x, p.y, e.x, e.y) < 100) p.turm.ausT = Math.max(p.turm.ausT, 3); });
    S.blitze.push({ art: "gift", x: e.x, y: e.y, r: 100, t: 0, dauer: 1.2 });
    text(e.x, e.y - 30, t().gift, "#8ac24a", 16); KLANG.puff();
  }

  function turmBeschaedigen(p, durchWurf) {
    if (!p || !p.turm) return;
    if (p.turm.st > 0) p.turm.st--; else p.turm = null;
    funken(p.x, p.y, 12, ["#6f9a3a", "#8a6440", "#ebe2cc"], 80);
    const A = S.A;
    A.zorn = klemm(A.zorn + 8 * zornFaktor(), 0, 100);
    if (A.zorn >= 100 && durchWurf) ausbruchAbwehr();
  }

  function explosion(x, y, r, schaden) {
    imKreis(x, y, r).forEach(e => treffen(e, schaden, "feuer"));
    S.A.feinde.filter(e => e.unsT && abst(x, y, e.x, e.y) <= r + e.r).forEach(e => treffen(e, schaden, "feuer"));
    S.blitze.push({ art: "explosion", x, y, r, t: 0, dauer: 0.55 });
    funken(x, y, 26, ["#e0a046", "#ffd34d", "#c4564a", "#ff8a3a"], 150, 3);
    KLANG.boom(); S.beben = Math.max(S.beben || 0, 0.25);
  }

  function feuerball(x, y) {
    const A = S.A;
    if (A.feuerCd > 0) { text(x, y, Math.ceil(A.feuerCd) + " s", "#a89f8f", 13, 0.7); return; }
    const sk = 1 + 0.06 * Math.min(S.lv, KAMPAGNE + 10);
    A.geschosse.push({ art: "feuerball", x0: HORT.x, y0: HORT.y - 26, x1: x, y1: y, x: HORT.x, y: HORT.y - 26, t: 0, dauer: 0.38, r: 50 + 8 * up("feuer"), schaden: 70 * (1 + 0.25 * up("feuer")) * sk });
    A.feuerCd = A.feuerMax;
    knistern(0.3, 0.12, "bandpass", 1400);
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
      if (t2 && abst(t2.x, t2.y, HORT.x, HORT.y) < 150) { turmBeschaedigen(t2); text(t2.x, t2.y - 20, "🔥", "#c4564a", 18); }
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
      if (!e.d.boss && !e.tot) { e.festT = Math.max(e.festT, 0.6); }
    });
    const chance = [0.45, 0.28, 0.14][bk];
    A.plaetze.forEach(p => {
      if (!p.turm || B.geprueft.has(p) || abst(p.x, p.y, B.x, B.y) > 46) return;
      B.geprueft.add(p);
      if (Math.random() < chance) { turmBeschaedigen(p); text(p.x, p.y - 22, "🐾", "#ebe2cc", 16); KLANG.stein(); }
    });
    if (B.s <= 0) { funken(B.x, B.y, 16, ["#a8783e", "#ebe2cc"], 80); A.baer = null; KLANG.puff(); }
  }

  /* Bauen */
  function wachterFrei(k) { return S.lv >= WACHTER[k].ab; }
  function kosten(k, st) { return WACHTER[k].kosten[st]; }
  function bauen(k) {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || p.turm) return;
    const c = kosten(k, 0); if (A.saat < c) { text(p.x, p.y - 20, t().bau.zuwenig, "#c4564a", 13); return; }
    A.saat -= c; p.turm = { k, st: 0, cd: 0.4, ausT: 0, wert: c, winkel: -Math.PI / 2, draussen: 0 };
    A.bauTyp = k; schreib("imres-echohort-bautyp", k);
    funken(p.x, p.y, 14, ["#6f9a3a", "#cfe6a8", "#ebe2cc"], 80); KLANG.bau();
    A.wahl = -1;
  }
  function verstaerken() {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || !p.turm || p.turm.st >= 2) return;
    const c = kosten(p.turm.k, p.turm.st + 1); if (A.saat < c) { text(p.x, p.y - 20, t().bau.zuwenig, "#c4564a", 13); return; }
    A.saat -= c; p.turm.st++; p.turm.wert += c;
    funken(p.x, p.y, 18, ["#e0a046", "#cfe6a8"], 90); KLANG.bau();
  }
  function ausreissen() {
    const A = S.A, p = A.plaetze[A.wahl]; if (!p || !p.turm) return;
    const n = Math.round(p.turm.wert * 0.5); A.saat += n; text(p.x, p.y - 20, "+" + n + " 🌱", "#cfe6a8", 13);
    p.turm = null; funken(p.x, p.y, 10, ["#8a6440", "#6f9a3a"], 70); KLANG.puff(); A.wahl = -1;
  }

  function abwehrTippen(p) {
    const A = S.A; if (A.fertig) return;
    const i = A.plaetze.findIndex(q => abst(q.x, q.y, p.x, p.y) < 24);
    if (i >= 0) {
      A.wahl = A.wahl === i ? -1 : i; KLANG.griff();
      if (!A.bauTyp || !wachterFrei(A.bauTyp)) { const l = lies("imres-echohort-bautyp", "dorn"); A.bauTyp = WACHTER[l] && wachterFrei(l) ? l : "dorn"; }
      return;
    }
    if (A.wahl >= 0) { A.wahl = -1; return; }
    feuerball(p.x, p.y);
  }

  /* ================== ZEICHNEN ================== */
  const leinwand = document.createElement("canvas");
  const ctx = leinwand.getContext("2d");
  let skala = 1, hgBild = null, hgSchluessel = "";
  function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function neueLeinwand() {
    const f = 2, c = document.createElement("canvas"); c.width = W * f; c.height = H * f;
    const x = c.getContext("2d"); x.scale(f, f); return [c, x];
  }
  function oval(x, cx, cy, rx, ry, w) { x.beginPath(); x.ellipse(cx, cy, rx, ry, w || 0, 0, Math.PI * 2); x.fill(); }
  function kreis(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); }

  /* --- Hintergrund des Raubzugs: oben Echos Platz, darunter ein Querschnitt durch das Gebiet --- */
  function hintergrundRaub(g) {
    const k = "raub" + g; if (hgSchluessel === k) return; hgSchluessel = k;
    const G = GEB[g], F = G.f, [c, x] = neueLeinwand(), r = lcg(11 + g * 7);
    let gr = x.createLinearGradient(0, 0, 0, 100);
    gr.addColorStop(0, F.himmel[0]); gr.addColorStop(1, F.himmel[1]);
    x.fillStyle = gr; x.fillRect(0, 0, W, 100);
    // Horizont je nach Gebiet
    if (g === 0 || g === 4) { // Wald / Donnerbaum: Tannen
      for (let i = 0; i < 22; i++) { const tx = i * 19 + r() * 10, h = 30 + r() * 40; x.fillStyle = g === 4 ? "#141a14" : "#132018"; x.beginPath(); x.moveTo(tx, 100 - h); x.lineTo(tx - h * 0.3, 100); x.lineTo(tx + h * 0.3, 100); x.fill(); }
    } else if (g === 1) { // Phandalin: Dächer
      for (let i = 0; i < 7; i++) { const bx = i * 60 + r() * 20, bw = 40 + r() * 20, bh = 20 + r() * 20; x.fillStyle = "#1f1716"; x.fillRect(bx, 100 - bh, bw, bh); x.fillStyle = "#3a1f1c"; x.beginPath(); x.moveTo(bx - 4, 100 - bh); x.lineTo(bx + bw / 2, 100 - bh - 16); x.lineTo(bx + bw + 4, 100 - bh); x.fill(); x.fillStyle = "rgba(224,160,70,.5)"; x.fillRect(bx + bw * 0.3, 100 - bh + 6, 5, 6); }
    } else if (g === 2) { // Wachturm
      x.fillStyle = "#1c1b24"; x.fillRect(300, 10, 46, 90); for (let i = 0; i < 4; i++) x.fillRect(298 + i * 13, 2, 8, 10);
      x.fillStyle = "rgba(224,160,70,.6)"; x.fillRect(318, 40, 6, 10);
      x.fillStyle = "#16151c"; x.fillRect(0, 76, W, 24);
    } else if (g === 3 || g === 5 || g === 7) { // Höhlendecke
      x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, 0, W, 100);
      x.fillStyle = F.boden[1];
      x.beginPath(); x.moveTo(0, 0); for (let i = 0; i <= 20; i++) x.lineTo(i * 20, 10 + r() * 18 + (i % 3 === 0 ? 18 : 0)); x.lineTo(W, 0); x.fill();
      if (g === 7) { gr = x.createLinearGradient(0, 60, 0, 100); gr.addColorStop(0, "rgba(224,96,42,0)"); gr.addColorStop(1, "rgba(224,96,42,.35)"); x.fillStyle = gr; x.fillRect(0, 60, W, 40); }
    } else if (g === 6) { // See: Felsufer
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
    // Schichten
    for (let s = 0; s < 5; s++) { x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 2; x.beginPath(); let y = 160 + s * 62; x.moveTo(0, y); for (let i = 0; i <= 20; i++) x.lineTo(i * 20, y + Math.sin(i * 0.9 + s) * 6 + r() * 4); x.stroke(); }
    // Körnung
    for (let i = 0; i < 500; i++) { x.fillStyle = r() < 0.5 ? "rgba(0,0,0,.18)" : "rgba(235,226,204,.04)"; x.fillRect(r() * W, 106 + r() * (H - 106), 1 + r() * 2, 1 + r() * 2); }
    // Gebietsdetails im Boden
    if (g === 0 || g === 4) { // Wurzeln
      for (let i = 0; i < 9; i++) { x.strokeStyle = g === 4 ? "rgba(90,70,48,.55)" : "rgba(80,62,40,.5)"; x.lineWidth = 2 + r() * 3; x.beginPath(); let px = r() * W, py = 104; x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += r() * 30 - 15; py += 14 + r() * 18; x.lineTo(px, py); } x.stroke(); }
      if (g === 4) for (let i = 0; i < 5; i++) { x.fillStyle = "rgba(235,226,204,.12)"; const bx = r() * W, by = 200 + r() * 250; oval(x, bx, by, 6, 3, r()); oval(x, bx + 6, by + 2, 3, 3); }
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
    // dunkle Vignette
    gr = x.createRadialGradient(W / 2, 290, 120, W / 2, 290, 340); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.45)");
    x.fillStyle = gr; x.fillRect(0, 100, W, H - 100);
    hgBild = c;
  }

  /* --- Hintergrund der Abwehr: Karte von oben mit Weg --- */
  function hintergrundAbwehr(g, P) {
    hgSchluessel = "abwehr" + g + ":" + S.lv;
    const G = GEB[g], F = G.f, [c, x] = neueLeinwand(), r = lcg(31 + g * 13 + S.lv);
    let gr = x.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, F.gras); gr.addColorStop(1, F.boden[1]);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 700; i++) { x.fillStyle = r() < 0.5 ? "rgba(0,0,0,.16)" : "rgba(235,226,204,.035)"; x.fillRect(r() * W, r() * H, 1 + r() * 2.5, 1 + r() * 2.5); }
    // Deko je nach Gebiet
    const deko = (n, fn) => { for (let i = 0; i < n; i++) { const px = r() * W, py = 30 + r() * (LEISTE - 40); if (abstZumPfad(P, px, py) < 26 || abst(px, py, HORT.x, HORT.y) < 50) continue; fn(px, py); } };
    if (F.wasser) {
      x.fillStyle = "rgba(74,160,176,.18)"; oval(x, 80, 90, 90, 50); oval(x, 330, 330, 80, 60);
      x.strokeStyle = "rgba(159,214,236,.18)"; x.lineWidth = 1; for (let i = 0; i < 20; i++) { const wx = r() * W, wy = r() * LEISTE; x.beginPath(); x.arc(wx, wy, 6 + r() * 6, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    }
    if (F.lava) { x.strokeStyle = "rgba(255,110,40,.4)"; x.lineWidth = 3; x.shadowColor = "#ff6a2a"; x.shadowBlur = 8; for (let i = 0; i < 4; i++) { x.beginPath(); let px = r() * W, py = r() * LEISTE; x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += r() * 50 - 25; py += r() * 50 - 25; x.lineTo(px, py); } x.stroke(); } x.shadowBlur = 0; }
    if (g === 0 || g === 4) deko(26, (px, py) => { const h = 14 + r() * 12; x.fillStyle = "rgba(0,0,0,.3)"; oval(x, px + 4, py + 4, h * 0.7, h * 0.5); x.fillStyle = g === 4 ? "#1d2a1a" : "#1f3320"; kreis(x, px, py, h * 0.7); x.fillStyle = g === 4 ? "#26361f" : "#2b4a2a"; kreis(x, px - 3, py - 3, h * 0.45); });
    if (g === 1) deko(10, (px, py) => { x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(px - 14, py - 10, 32, 26); x.fillStyle = "#3a1f1c"; x.fillRect(px - 16, py - 13, 32, 24); x.strokeStyle = "#5a2f28"; x.lineWidth = 1; x.beginPath(); x.moveTo(px - 16, py - 1); x.lineTo(px + 16, py - 1); x.stroke(); });
    if (F.mauer || g === 3 || g === 5 || g === 7) deko(22, (px, py) => { x.fillStyle = F.stein; x.globalAlpha = 0.6; oval(x, px, py, 5 + r() * 8, 4 + r() * 6, r()); x.globalAlpha = 1; });
    if (F.pilze) deko(18, (px, py) => { x.fillStyle = "rgba(196,154,224,.2)"; kreis(x, px, py, 8); x.fillStyle = "rgba(196,154,224,.65)"; kreis(x, px, py, 3); });
    if (F.schienen) { x.strokeStyle = "rgba(138,128,112,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 60); x.lineTo(W, 120); x.moveTo(0, 66); x.lineTo(W, 126); x.stroke(); }
    // Weg
    const weg = (breite, farbe) => { x.strokeStyle = farbe; x.lineWidth = breite; x.lineJoin = "round"; x.lineCap = "round"; x.beginPath(); P.p.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); x.stroke(); };
    weg(36, "rgba(0,0,0,.35)"); weg(30, F.weg); weg(22, F.wasser ? "#33464f" : "rgba(235,226,204,.07)");
    for (let i = 0; i < 160; i++) { const s = r() * P.gesamt, q = pfadPunkt(P, s); x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(q.x + r() * 20 - 10, q.y + r() * 20 - 10, 2, 2); }
    // Eingang oben
    const st = P.p[0];
    x.fillStyle = "rgba(0,0,0,.55)"; oval(x, st.x, st.y - 4, 26, 14);
    // Vignette
    gr = x.createRadialGradient(W / 2, 230, 140, W / 2, 230, 330); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.5)");
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    hgBild = c;
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
    if (g === 0) { // Eicheln
      for (const [ox, oy] of [[-4, 2], [4, 0]]) { x.fillStyle = "#a8783e"; oval(x, ox, oy + 2, 4, 5.5); x.fillStyle = "#5a4430"; oval(x, ox, oy - 2.5, 4.8, 2.6); x.fillRect(ox - 0.6, oy - 6, 1.2, 2); }
    } else if (g === 1) { // Kräuter
      x.strokeStyle = "#4d6b35"; x.lineWidth = 1.4; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(0, 8); x.quadraticCurveTo(i * 3, 0, i * 5, -7); x.stroke(); x.fillStyle = "#6f9a3a"; oval(x, i * 5, -7, 2.4, 3.6, i * 0.3); }
      x.fillStyle = "#8a6440"; x.fillRect(-3, 6, 6, 3);
    } else if (g === 2) { // Moos
      for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? "#5f8a4a" : "#4a7038"; kreis(x, Math.cos(i) * 5, Math.sin(i * 1.3) * 4, 4.5); }
    } else if (g === 3) { // Leuchtkristalle
      x.save(); x.shadowColor = "#7fd6e0"; x.shadowBlur = 10; x.fillStyle = "#7fd6e0";
      for (const [ox, h] of [[-4, 12], [1, 16], [5, 10]]) { x.beginPath(); x.moveTo(ox - 2.5, 6); x.lineTo(ox, 6 - h); x.lineTo(ox + 2.5, 6); x.fill(); }
      x.restore();
    } else if (g === 4) { // Wurzelholz
      x.strokeStyle = "#8a6440"; x.lineWidth = 3; x.lineCap = "round"; x.beginPath(); x.moveTo(-8, 4); x.quadraticCurveTo(0, -6, 8, 2); x.moveTo(-2, -1); x.lineTo(-5, -8); x.moveTo(3, 0); x.lineTo(6, -6); x.stroke();
    } else if (g === 5) { // Sporenpilze
      x.save(); x.shadowColor = "#c49ae0"; x.shadowBlur = 8;
      for (const [ox, s] of [[-4, 1], [4, 0.8]]) { x.fillStyle = "#e8dcd0"; x.fillRect(ox - 1.2, -1, 2.4, 7 * s); x.fillStyle = "#c49ae0"; oval(x, ox, -1, 5 * s, 3.5 * s); }
      x.restore();
    } else if (g === 6) { // Muscheln
      x.fillStyle = "#e8c8b0"; x.beginPath(); x.moveTo(0, 6); x.lineTo(-8, -2); x.quadraticCurveTo(0, -12, 8, -2); x.closePath(); x.fill();
      x.strokeStyle = "rgba(138,100,64,.6)"; x.lineWidth = 0.8; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(0, 6); x.lineTo(i * 3.5, -7); x.stroke(); }
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
    if (MEDAILLONS[e.typ]) {
      x.save(); x.shadowColor = d.unbesiegbar ? "#c4564a" : "#e0a046"; x.shadowBlur = 14;
      x.fillStyle = d.farbe; kreis(x, 0, 0, r + 3); x.restore();
      x.drawImage(MEDAILLONS[e.typ], -r, -r, r * 2, r * 2);
      x.strokeStyle = d.unbesiegbar ? "#c4564a" : "#e0a046"; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, r + 1, 0, Math.PI * 2); x.stroke();
    } else malFigur(x, e.typ, r, d, zeit, e);
    if (e.bremsT > 0 && e.bremse < 1) { x.strokeStyle = "rgba(159,214,236,.7)"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, r + 3, 0, Math.PI * 2); x.stroke(); }
    if (e.giftT > 0) { x.fillStyle = "rgba(196,154,224,.5)"; kreis(x, Math.sin(zeit * 5) * r * 0.7, -r - 3, 2); kreis(x, -Math.cos(zeit * 4) * r * 0.6, -r - 5, 1.5); }
    if (e.festT > 0) { x.strokeStyle = "#8a6440"; x.lineWidth = 2; x.beginPath(); x.moveTo(-r, r); x.quadraticCurveTo(-r * 0.5, 0, 0, r * 0.8); x.quadraticCurveTo(r * 0.5, 0, r, r); x.stroke(); }
    x.restore();
    lebensbalken(x, e);
  }
  function lebensbalken(x, e) {
    if (e.d.unbesiegbar || e.hp >= e.max) return;
    const b = Math.max(14, e.r * 2), y = e.y - e.r - (e.flug ? 14 : 8);
    x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(e.x - b / 2 - 1, y - 1, b + 2, 4);
    x.fillStyle = e.d.boss ? "#c4564a" : "#8ac24a"; x.fillRect(e.x - b / 2, y, b * klemm(e.hp / e.max, 0, 1), 2);
  }
  function malFigur(x, typ, r, d, zeit, e) {
    const k = { goblin: 0, rotrobe: 1, bandit: 1, bugbear: 2, soeldner: 3, zombie: 4, blight: 5, spinne: 6, drow: 7, ettercap: 8, chasme: 9, kuotoa: 10, duergar: 11, anfuehrer: 0, glasstab: 1, nezna: 7 }[typ];
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
    if (k === 5) { // Blight: Wurzelknäuel
      x.strokeStyle = f; x.lineWidth = 2.2; x.lineCap = "round";
      for (let i = 0; i < 6; i++) { const w = i / 6 * Math.PI * 2 + Math.sin(zeit * 6) * 0.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(w) * r * 1.2, Math.sin(w) * r * 1.2); x.stroke(); }
      x.fillStyle = "#3b2a1b"; kreis(x, 0, 0, r * 0.6); x.fillStyle = "#ff3a2a"; kreis(x, -1.8, -1, 1.2); kreis(x, 1.8, -1, 1.2);
      return;
    }
    // humanoide Gestalten von oben: Schultern, Kopf, Merkmal
    x.fillStyle = "rgba(0,0,0,.25)"; kreis(x, 0, 1, r);
    x.fillStyle = f; oval(x, 0, 2, r, r * 0.75);
    const kopf = { 0: "#7d8f43", 1: "#2a2622", 2: "#8a6a3a", 3: "#9a9fa6", 4: "#7a8a6a", 7: "#e8e2f0", 10: "#4aa0a0", 11: "#8a8480" }[k] || "#c9a88a";
    x.fillStyle = kopf; kreis(x, 0, -r * 0.25, r * 0.55);
    if (k === 0) { x.fillStyle = "#6b7d3e"; x.beginPath(); x.moveTo(-r * 0.45, -r * 0.4); x.lineTo(-r * 1.15, -r * 0.8); x.lineTo(-r * 0.35, -r * 0.1); x.fill(); x.beginPath(); x.moveTo(r * 0.45, -r * 0.4); x.lineTo(r * 1.15, -r * 0.8); x.lineTo(r * 0.35, -r * 0.1); x.fill(); x.fillStyle = "#ffd34d"; kreis(x, -1.8, -r * 0.35, 1); kreis(x, 1.8, -r * 0.35, 1); }
    if (k === 1) { x.fillStyle = typ === "bandit" ? "#3a2d20" : "#7a2f26"; kreis(x, 0, -r * 0.3, r * 0.58); x.fillStyle = "#c9a88a"; oval(x, 0, -r * 0.05, r * 0.3, r * 0.2); }
    if (k === 2) { x.fillStyle = "#6b4a2a"; kreis(x, -r * 0.4, -r * 0.6, 2.5); kreis(x, r * 0.4, -r * 0.6, 2.5); x.fillStyle = "#c4564a"; kreis(x, -2, -r * 0.3, 1.1); kreis(x, 2, -r * 0.3, 1.1); }
    if (k === 3) { x.strokeStyle = "#5a5e64"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, -r * 0.25, r * 0.55, Math.PI, 0); x.stroke(); x.fillStyle = "#c9c9c9"; x.fillRect(r * 0.7, -r, 2, r * 1.4); }
    if (k === 4) { x.fillStyle = "#3a4a2a"; kreis(x, -2, -r * 0.3, 1.4); kreis(x, 2, -r * 0.3, 1.4); x.strokeStyle = "#5a6a4c"; x.lineWidth = 3; x.beginPath(); x.moveTo(-r * 0.7, 0); x.lineTo(-r * 0.9, -r); x.moveTo(r * 0.7, 0); x.lineTo(r * 0.9, -r); x.stroke(); }
    if (k === 7) { x.fillStyle = "#3b2f4a"; oval(x, 0, -r * 0.05, r * 0.32, r * 0.24); x.fillStyle = "#c4564a"; kreis(x, -1.5, -r * 0.1, 0.9); kreis(x, 1.5, -r * 0.1, 0.9); }
    if (k === 10) { x.fillStyle = "#ebe2cc"; kreis(x, -r * 0.35, -r * 0.35, 2.2); kreis(x, r * 0.35, -r * 0.35, 2.2); x.fillStyle = "#1a1210"; kreis(x, -r * 0.35, -r * 0.35, 1); kreis(x, r * 0.35, -r * 0.35, 1); }
    if (k === 11) { x.fillStyle = "#4a4440"; x.beginPath(); x.moveTo(-r * 0.4, -r * 0.05); x.lineTo(0, r * 0.6); x.lineTo(r * 0.4, -r * 0.05); x.fill(); }
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
      if (st === 2) for (let i = 0; i < 6; i++) blatt(x, -2, 0, i * 1.047 + zeit * 0.4, 9, 3.5, i % 2 ? "#c4564a" : "#9b3a2f");
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
      if (st === 2) { x.save(); x.shadowColor = "#e0a046"; x.shadowBlur = 6; x.fillStyle = "#e0a046"; x.fillRect(-5, -6, 1.6, 5); x.fillRect(-2, -3, 3.5, 1.4); x.fillRect(2, -7, 1.6, 6); x.restore(); }
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
        x.save(); x.shadowColor = "#ffd34d"; x.shadowBlur = 6; x.fillStyle = "#ffd34d";
        oval(x, -2.5, 0, 1.4, 1.4 * blink); oval(x, 2.5, 0, 1.4, 1.4 * blink);
        if (st === 2) { oval(x, -3.5, 4.5, 1.1, 1.1 * blink); oval(x, 0.5, 4.5, 1.1, 1.1 * blink); }
        x.restore();
      }
      x.strokeStyle = "#ebe2cc"; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-14, 9); x.lineTo(-9, 7); x.stroke(); x.fillStyle = "#ebe2cc"; kreis(x, -14, 9, 1.2); kreis(x, -9, 7, 1.2);
    } else if (k === "eis") {
      x.fillStyle = "rgba(0,0,0,.35)"; oval(x, 2, 9, 18, 6);
      x.fillStyle = "rgba(207,234,244,.35)"; oval(x, 0, 5, 17, 8);
      x.strokeStyle = "rgba(159,214,236,.8)"; x.lineWidth = 1.4; x.beginPath(); x.ellipse(0, 5, 17, 8, 0, 0, Math.PI * 2); x.stroke();
      x.save(); if (an > 0) { x.shadowColor = "#cfeaf4"; x.shadowBlur = 14 * an; }
      if (st === 2) { kristall(x, -12, 6, -0.7, 7, 2.6, an); kristall(x, 12, 6, 0.7, 7, 2.6, an); }
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
      if (st === 2) { x.strokeStyle = "rgba(224,160,70,.8)"; x.lineWidth = 1; x.beginPath(); x.ellipse(0, -2, 6, 2, 0, 0, Math.PI * 2); x.stroke(); }
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
  function malWachter(x, p, zeit, gewaehlt) {
    const T = p.turm, w = WACHTER[T.k], st = T.st;
    x.save(); x.translate(p.x, p.y);
    if (gewaehlt) {
      x.strokeStyle = "rgba(224,160,70,.6)"; x.fillStyle = "rgba(224,160,70,.08)"; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, w.reich[st], 0, Math.PI * 2); x.fill(); x.stroke();
      if (st < 2) { x.strokeStyle = "rgba(207,230,168,.55)"; x.setLineDash([4, 4]); x.beginPath(); x.arc(0, 0, w.reich[st + 1], 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
    }
    malTurm(x, T.k, st, T, zeit);
    for (let i = 0; i < 3; i++) { x.fillStyle = i <= st ? "#e0a046" : "rgba(235,226,204,.18)"; kreis(x, -6 + i * 6, 17, 2); }
    if (T.ausT > 0) {
      x.fillStyle = "rgba(20,20,24,.5)"; kreis(x, 0, -4, 19);
      if (T.netz) { x.strokeStyle = "rgba(235,226,204,.85)"; x.lineWidth = 0.8; for (let a = 0; a < 6; a++) { x.beginPath(); x.moveTo(0, -4); x.lineTo(Math.cos(a) * 20, -4 + Math.sin(a) * 20); x.stroke(); } x.beginPath(); x.arc(0, -4, 8, 0, 7); x.stroke(); x.beginPath(); x.arc(0, -4, 15, 0, 7); x.stroke(); }
      else { x.fillStyle = "#ebe2cc"; x.font = "11px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("💤", 10, -20); }
    }
    x.restore();
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
      malWolf(x, g.x, g.y, g.links, zeit * (g.zustand === "hin" ? 1 : 0.8), g.zustand === "hin");
    }
  }
  function malWolf(x, wx, wy, links, zeit, wild) {
    x.save(); x.translate(wx, wy); if (!links) x.scale(-1, 1);
    x.fillStyle = "rgba(0,0,0,.3)"; oval(x, 0, 6, 10, 2.5);
    const lauf = Math.sin(zeit * 26);
    x.strokeStyle = "#6a655c"; x.lineWidth = 2; x.lineCap = "round";
    x.beginPath(); x.moveTo(-5, 1); x.lineTo(-7 + lauf * 3, 6); x.moveTo(-3, 1); x.lineTo(-1 - lauf * 3, 6); x.moveTo(4, 1); x.lineTo(2 + lauf * 3, 6); x.moveTo(6, 1); x.lineTo(8 - lauf * 3, 6); x.stroke();
    x.fillStyle = "#8a847a"; oval(x, 0, -1, 8, 4);
    x.fillStyle = "#6a655c"; x.beginPath(); x.moveTo(7, -2); x.quadraticCurveTo(13, -6 + lauf, 14, -1); x.lineTo(8, 0); x.fill();
    x.fillStyle = "#a8a296"; kreis(x, -8, -3, 3.6);
    x.beginPath(); x.moveTo(-10, -2); x.lineTo(-14.5, -1); x.lineTo(-10, 0.5); x.fill();
    x.fillStyle = "#6a655c"; x.beginPath(); x.moveTo(-9, -5); x.lineTo(-8.5, -9); x.lineTo(-6.5, -5.5); x.fill();
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
    // Feuerball-Ladung als Ring um Echo
    const u = 1 - A.feuerCd / A.feuerMax;
    x.strokeStyle = u >= 1 ? "rgba(255,138,58,.9)" : "rgba(235,226,204,.25)"; x.lineWidth = 2.5;
    x.beginPath(); x.arc(HORT.x + 40, HORT.y - 4, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u); x.stroke();
    if (u >= 1) { x.save(); x.shadowColor = "#ff8a3a"; x.shadowBlur = 10; x.fillStyle = "#ffb060"; kreis(x, HORT.x + 56, HORT.y - 18, 3 + Math.sin(zeit * 8)); x.restore(); }
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
      if (b.art === "explosion") {
        const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * (0.5 + u * 0.6));
        g.addColorStop(0, "rgba(255,240,160," + a + ")"); g.addColorStop(0.4, "rgba(255,138,58," + a * 0.8 + ")"); g.addColorStop(1, "rgba(196,86,74,0)");
        x.fillStyle = g; kreis(x, b.x, b.y, b.r * (0.5 + u * 0.6));
      } else if (b.art === "blitz") {
        const r = lcg(Math.floor(b.seed * 1e6) + Math.floor(zeit * 30));
        x.strokeStyle = "rgba(243,226,122," + a + ")"; x.lineWidth = 2.5; x.shadowColor = "#f3e27a"; x.shadowBlur = 10;
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
      x.lineWidth = 3; x.strokeStyle = "rgba(9,8,15,.85)"; x.strokeText(tx.s, tx.x, tx.y - u * 26);
      x.fillStyle = tx.farbe; x.fillText(tx.s, tx.x, tx.y - u * 26);
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
    const z = zielInfo(R), art = zielArt(R, z.d);
    const farbe = { gut: "255,211,77", schlecht: "214,90,74", gesperrt: "190,182,166", leer: "235,226,204" }[art];
    const ex = DREH.x + z.dx * z.len, ey = DREH.y + z.dy * z.len;
    x.save(); x.lineCap = "round";
    x.strokeStyle = "rgba(" + farbe + ",.18)"; x.lineWidth = 7; x.beginPath(); x.moveTo(DREH.x, DREH.y); x.lineTo(ex, ey); x.stroke();
    x.strokeStyle = "rgba(" + farbe + ",.85)"; x.lineWidth = 2; x.setLineDash([7, 6]); x.lineDashOffset = -zeit * 40;
    x.beginPath(); x.moveTo(DREH.x, DREH.y); x.lineTo(ex, ey); x.stroke(); x.setLineDash([]);
    const puls = 0.5 + Math.sin(zeit * 8) * 0.5;
    if (z.d) {
      const d = z.d, r = d.r + 6 + puls * 2;
      x.strokeStyle = "rgba(" + farbe + ",.95)"; x.lineWidth = 2.2; x.beginPath(); x.arc(d.x, d.y, r, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 2.6;
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + zeit * 1.5; x.beginPath(); x.moveTo(d.x + Math.cos(a) * (r + 2), d.y + Math.sin(a) * (r + 2)); x.lineTo(d.x + Math.cos(a) * (r + 7), d.y + Math.sin(a) * (r + 7)); x.stroke(); }
      if (art !== "gut") { x.font = "700 13px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "rgba(" + farbe + ",1)"; x.fillText(art === "gesperrt" ? "🔒" : "✕", d.x + r + 4, d.y - r); }
    } else {
      x.fillStyle = "rgba(" + farbe + ",.7)"; kreis(x, ex, ey, 3 + puls * 1.5);
    }
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
    R.dinge.forEach(d => malDing(x, d, zeit));
    if (h.zustand === "schwingen" && !R.fertig && R.schmollT <= 0) malZielstrahl(x, R, zeit);
    malRanke(x, R, zeit);
    if (h.last) malDing(x, h.last, zeit);
    malEffekte(x, zeit);
    if (S.quip && S.quip.t < 2) sprechblase(x, S.quip.s, DREH.x + 70, 40);
    // oben: Anzeigen
    x.fillStyle = "rgba(9,8,15,.62)"; x.fillRect(0, 0, W, 28);
    let px = 8;
    px = hudText(x, "⏳ " + Math.ceil(R.zeit), px, R.zeit < 8 ? "#c4564a" : "#ebe2cc") + 10;
    balken(x, px, 7, 76, 14, R.zorn / 100, R.zorn > 75 ? "#c4564a" : "#9b5a3a", T.hud.zorn); px += 86;
    px = hudText(x, "💰 " + R.beute, px, "#ffd34d") + 6;
    if (R.gier) px = hudText(x, "×" + (1 + 0.15 * R.gier).toFixed(2).replace(/0$/, ""), px, "#e0a046", 11) + 8; else px += 4;
    hudText(x, "🌱 " + Math.round(R.saat), px, "#cfe6a8");
    // unten: Gestalten
    x.fillStyle = "rgba(9,8,15,.7)"; x.fillRect(0, LEISTE, W, H - LEISTE);
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
  function zeichneAbwehr(x, zeit) {
    const A = S.A, T = t();
    x.drawImage(hgBild, 0, 0, W, H);
    // Pflanzplätze
    A.plaetze.forEach((p, i) => {
      if (p.turm) return;
      const gew = A.wahl === i, puls = 0.5 + Math.sin(zeit * 3 + i) * 0.25;
      x.fillStyle = gew ? "rgba(224,160,70,.3)" : "rgba(111,154,58," + (0.12 + puls * 0.12) + ")"; kreis(x, p.x, p.y, 15);
      x.strokeStyle = gew ? "#e0a046" : "rgba(207,230,168," + (0.35 + puls * 0.3) + ")"; x.lineWidth = 1.5; x.setLineDash([3, 3]);
      x.beginPath(); x.arc(p.x, p.y, 15, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
      x.font = "11px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle"; x.globalAlpha = 0.7; x.fillText("🌱", p.x, p.y + 1); x.globalAlpha = 1;
    });
    A.plaetze.forEach((p, i) => { if (p.turm) malWachter(x, p, zeit, A.wahl === i); });
    malHort(x, A, zeit);
    A.feinde.slice().sort((a, b) => a.y - b.y).forEach(e => malFeind(x, e, zeit));
    A.geschosse.forEach(g => {
      if (g.art === "dorn" || g.art === "splitter" || g.art === "spore" || g.art === "wolf") malGeschoss(x, g, zeit);
      else if (g.art === "feuerball") { x.save(); x.shadowColor = "#ff8a3a"; x.shadowBlur = 16; x.fillStyle = "#ffd27a"; kreis(x, g.x, g.y, 6); x.fillStyle = "#ff8a3a"; kreis(x, g.x, g.y, 3.5); x.restore(); funken(g.x, g.y, 1, ["#ff8a3a", "#e0a046"], 20, 2); }
      else if (g.art === "fels") { x.fillStyle = "#6a6458"; kreis(x, g.x, g.y, 7); x.fillStyle = "#8a8476"; kreis(x, g.x - 2, g.y - 2, 3); }
    });
    if (A.baer) malBaer(x, A.baer, zeit);
    malEffekte(x, zeit);
    if (S.quip && S.quip.t < 2) sprechblase(x, S.quip.s, HORT.x + 60, HORT.y - 54);
    // Vorbereitung
    if (A.vorT > 0) {
      x.fillStyle = "rgba(9,8,15,.55)"; x.fillRect(20, 150, W - 40, 74);
      x.textAlign = "center"; x.textBaseline = "middle";
      x.font = "22px " + FONT_D; x.fillStyle = "#e0a046"; x.fillText(T.kommen(Math.ceil(A.vorT)), W / 2, 172, W - 60);
      x.font = "12px " + FONT_B; x.fillStyle = "#ebe2cc";
      zeilenUmbruch(x, T.abwehrIntro, W / 2, 196, W - 70, 14);
    }
    if (A.demo && A.bossGerufen && !A.demoWeg) {
      x.textAlign = "center"; x.font = "700 13px " + FONT_B; x.fillStyle = "#9fd6ec"; x.fillText("🌊 " + Math.ceil(A.demoDauer - A.demoT) + " s", W / 2, 42);
    }
    // oben: Anzeigen
    x.fillStyle = "rgba(9,8,15,.62)"; x.fillRect(0, 0, W, 28);
    let px = 8;
    px = hudText(x, "💰 " + Math.round(A.hort), px, A.hort < A.hortStart * 0.3 ? "#c4564a" : "#ffd34d") + 10;
    px = hudText(x, "🌱 " + Math.round(A.saat), px, "#cfe6a8") + 10;
    balken(x, px, 7, 76, 14, A.zorn / 100, A.zorn > 75 ? "#c4564a" : "#9b5a3a", T.hud.zorn); px += 86;
    hudText(x, "👣 " + (A.warte.length + A.feinde.filter(e => !e.d.unbesiegbar).length), px, "#a89f8f", 12);
    // unten: Bauleiste
    x.fillStyle = "rgba(9,8,15,.72)"; x.fillRect(0, LEISTE, W, H - LEISTE);
    S.knoepfe = [];
    const p = A.wahl >= 0 ? A.plaetze[A.wahl] : null;
    x.textAlign = "left"; x.textBaseline = "middle";
    if (p && !p.turm) {
      const frei = WACHTER_REIHE.filter(wachterFrei), bw = Math.min(62, (W - 12) / frei.length - 4);
      frei.forEach((k, i) => knopfTurm(x, "bau:" + k, 6 + i * (bw + 4), LEISTE + 3, bw, H - LEISTE - 6, k, 0, kosten(k, 0), A.bauTyp === k, A.saat < kosten(k, 0), zeit));
      turmTafel(x, A, p, A.bauTyp, 0, true, zeit);
    } else if (p && p.turm) {
      const lvl = p.turm.st;
      x.font = "600 11px " + FONT_B; x.fillStyle = "#a89f8f"; x.textAlign = "left"; x.fillText(T.bau.stufeVon(lvl + 1), 10, LEISTE + 26);
      for (let i = 0; i < 3; i++) { x.fillStyle = i <= lvl ? "#e0a046" : "rgba(235,226,204,.2)"; kreis(x, 82 + i * 10, LEISTE + 26, 3.2); }
      if (lvl < 2) { const c = kosten(p.turm.k, lvl + 1); knopf(x, "staerker", 116, LEISTE + 4, 170, H - LEISTE - 8, [T.bau.verstaerken, "🌱" + c], true, A.saat < c, A.saat < c ? "#c4564a" : "#cfe6a8"); }
      else knopf(x, "nix", 116, LEISTE + 4, 170, H - LEISTE - 8, [T.bau.max], false, true);
      knopf(x, "raus", 292, LEISTE + 4, 102, H - LEISTE - 8, [T.bau.ausreissen, "+" + Math.round(p.turm.wert * 0.5) + " 🌱"], false, false);
      turmTafel(x, A, p, p.turm.k, lvl, false, zeit);
    } else if (A.vorT > 0) {
      knopf(x, "jetzt", W / 2 - 90, LEISTE + 6, 180, H - LEISTE - 12, [T.jetzt], true, false, "#e0a046");
    } else {
      const u = A.feuerCd <= 0;
      x.font = "700 13px " + FONT_B; x.fillStyle = u ? "#ffb060" : "#a89f8f";
      x.fillText("☄️ " + T.hud.feuerball + (u ? " ✓" : " · " + Math.ceil(A.feuerCd) + " s"), 10, LEISTE + 26);
      x.textAlign = "right"; x.font = "600 11px " + FONT_B; x.fillStyle = "#a89f8f";
      x.fillText(levelName(A.lv), W - 10, LEISTE + 26, 200);
    }
  }
  function knopfTurm(x, id, bx, by, bw, bh, k, st, preis, an, zuTeuer, zeit) {
    S.knoepfe.push({ id, x: bx, y: by, w: bw, h: bh });
    x.fillStyle = an ? "rgba(224,160,70,.26)" : "rgba(235,226,204,.07)";
    x.strokeStyle = an ? "#e0a046" : "rgba(235,226,204,.22)"; x.lineWidth = an ? 1.6 : 1;
    x.beginPath(); x.roundRect ? x.roundRect(bx, by, bw, bh, 6) : x.rect(bx, by, bw, bh); x.fill(); x.stroke();
    x.save(); x.beginPath(); x.rect(bx, by, bw, bh - 11); x.clip();
    x.translate(bx + bw / 2, by + bh - 19); x.scale(0.68, 0.68); if (zuTeuer) x.globalAlpha = 0.5;
    malTurm(x, k, st, null, zeit); x.restore();
    x.font = "700 10px " + FONT_B; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = zuTeuer ? "#c4564a" : "#cfe6a8"; x.fillText("🌱" + preis, bx + bw / 2, by + bh - 6);
  }
  function turmWerte(k, st) {
    const w = WACHTER[k], f = 1 + 0.045 * Math.min(S.lv, KAMPAGNE + 10);
    return { schaden: Math.round(w.schaden[st] * f), schadenRoh: w.schaden[st], reich: w.reich[st], tempo: 1 / w.rate };
  }
  function turmTafel(x, A, p, k, st, bauModus, zeit) {
    const T = t(), w = WACHTER[k], [name, info] = T.wachter[k];
    const ph = 104, pw = W - 12, px = 6, py = p.y > LEISTE - ph - 50 ? 32 : LEISTE - ph - 4;
    // Vorschau der Reichweite am Bauplatz
    if (bauModus) {
      x.save(); x.strokeStyle = "rgba(224,160,70,.65)"; x.fillStyle = "rgba(224,160,70,.07)"; x.setLineDash([5, 4]); x.lineWidth = 1.3;
      x.beginPath(); x.arc(p.x, p.y, w.reich[0], 0, Math.PI * 2); x.fill(); x.stroke(); x.setLineDash([]);
      x.translate(p.x, p.y); x.globalAlpha = 0.6; malTurm(x, k, 0, null, zeit); x.restore();
    }
    x.save();
    x.fillStyle = "rgba(18,14,11,.93)"; x.strokeStyle = w.farbe; x.lineWidth = 1.4;
    x.beginPath(); x.roundRect ? x.roundRect(px, py, pw, ph, 8) : x.rect(px, py, pw, ph); x.fill(); x.stroke();
    // Bild
    x.fillStyle = "rgba(235,226,204,.05)"; x.beginPath(); x.roundRect ? x.roundRect(px + 6, py + 6, 58, ph - 12, 6) : x.rect(px + 6, py + 6, 58, ph - 12); x.fill();
    x.save(); x.translate(px + 35, py + ph / 2 + 14); x.scale(1.25, 1.25); malTurm(x, k, st, null, zeit); x.restore();
    const tx = px + 72;
    x.textAlign = "left"; x.textBaseline = "middle";
    x.font = "16px " + FONT_D; x.fillStyle = "#e0a046"; x.fillText(name + (bauModus ? "" : " · " + T.bau.stufeVon(st + 1)), tx, py + 14, pw - 80);
    x.font = "11px " + FONT_B; x.fillStyle = "#c8bfae"; x.fillText(info, tx, py + 30, bauModus ? 226 : pw - 80);
    const jetzt = turmWerte(k, st), dann = !bauModus && st < 2 ? turmWerte(k, st + 1) : null;
    const zeile = (y, label, wert, max, txt, wertDann, txtDann) => {
      x.font = "600 10px " + FONT_B; x.fillStyle = "#a89f8f"; x.textAlign = "left"; x.fillText(label, tx, y);
      const bx = tx + 64, bw = 78;
      x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(bx, y - 3.5, bw, 7);
      if (wertDann != null) { x.fillStyle = "rgba(207,230,168,.45)"; x.fillRect(bx, y - 3.5, bw * klemm(wertDann / max, 0, 1), 7); }
      x.fillStyle = w.farbe; x.fillRect(bx, y - 3.5, bw * klemm(wert / max, 0, 1), 7);
      x.font = "700 11px " + FONT_B; x.fillStyle = "#ebe2cc"; x.fillText(txt, bx + bw + 6, y);
      if (txtDann) { const tw = x.measureText(txt).width; x.fillStyle = "#cfe6a8"; x.fillText(" → " + txtDann, bx + bw + 6 + tw, y); }
    };
    const gift = w.typ === "gift";
    const schadenTxt = v => gift ? T.bau.giftProSek(v) : String(v);
    zeile(py + 48, T.bau.werte.schaden, jetzt.schadenRoh, 90, schadenTxt(jetzt.schaden), dann ? dann.schadenRoh : null, dann ? schadenTxt(dann.schaden) : null);
    zeile(py + 62, T.bau.werte.reich, jetzt.reich, 125, String(jetzt.reich), dann ? dann.reich : null, dann ? String(dann.reich) : null);
    zeile(py + 76, T.bau.werte.tempo, jetzt.tempo, 1.7, T.bau.proSek(jetzt.tempo.toFixed(1).replace(".", sprache() === "de" ? "," : ".")), null, null);
    x.font = "italic 10.5px " + FONT_B; x.fillStyle = "#cfe6a8";
    x.fillText("✦ " + T.bau.spez[k](w, st), tx, py + 93, bauModus ? 226 : pw - 80);
    x.restore();
    if (bauModus) {
      const c = kosten(k, 0);
      knopf(x, "pflanzen", px + pw - 84, py + 40, 78, 46, [T.bau.pflanzen, "🌱" + c], true, A.saat < c, A.saat < c ? "#c4564a" : "#cfe6a8");
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
  function schleife(jetzt) {
    rafId = 0;
    const dt = letzte ? Math.min(0.05, (jetzt - letzte) / 1000) : 0;
    letzte = jetzt;
    for (let i = 0; i < testTempo && zustand === "spiel" && S; i++) {
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
      '<div class="eh-buehne"><button type="button" class="eh-pause" aria-label="Pause"><span aria-hidden="true">❚❚</span></button><div class="eh-schleier"><div class="eh-tafel"></div></div></div>' +
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
    tonKnopf.addEventListener("click", () => { tonAn = !tonAn; schreib("imres-echohort-ton", tonAn ? "1" : "0"); fussSetzen(); if (tonAn) KLANG.gold(); });
    pauseKnopf.addEventListener("click", pausieren);
    tafel.addEventListener("click", tafelKlick);
    tafel.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest(".eh-name")) { e.preventDefault(); eintragen(); } });
    fussSetzen();
  }
  function fussSetzen() {
    const tx = t(), st = aktuelleStufe(), r = parseInt(lies(rekordKey(st), "0"), 10);
    fussRekord.textContent = r ? tx.rekord(r, tx.stufen[st]) : "";
    tonKnopf.textContent = tonAn ? tx.ton[0] : tx.ton[1];
    tonKnopf.setAttribute("aria-pressed", String(tonAn));
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
    ({ start: startZeigen, intro: introZeigen, nachRaub: () => nachRaubZeigen(true), ergebnis: () => ergebnisZeigen(true), hain: hainZeigen, pause: pauseZeigen, ende: () => spielEnde(true) })[tafelArt]();
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
    schleierAuf('<h4>' + esc(tx.titel) + '</h4>' + fort + stufenHtml(tx) +
      '<button type="button" class="tav-knopf ' + (sp ? "" : "eh-haupt") + '" data-tun="neu">' + esc(tx.neu) + '</button>' +
      (sp ? '<p class="eh-klein">' + esc(tx.neuWarnung) + '</p>' : ""), "start");
  }

  function introZeigen() {
    const tx = t(), lv = S.lv, g = gebietVon(lv);
    zustand = "tafel";
    S.R = null; S.A = null;
    hintergrundRaub(g); hgSchluessel = "raub" + g;
    const neu = neueFreischaltungen(lv);
    const [name, text] = lv < KAMPAGNE ? tx.gebiete[g] : [tx.endlosName, tx.endlosText(endlosRunde(lv))];
    const unter = lv < KAMPAGNE ? tx.levelKurz(tx.gebiete[g][0], innenVon(lv) + 1).split(" · ")[1] : tx.levelEndlos(endlosRunde(lv));
    schleierAuf(
      '<p class="eh-ober">' + esc(unter) + (istBossLevel(lv) ? ' · ☠' : '') + '</p>' +
      '<h4>' + esc(name) + '</h4>' +
      '<p class="eh-erzaehl">' + esc(text) + '</p>' +
      (neu.length ? '<p class="eh-neu">' + esc(tx.neuFreigeschaltet) + ' ' + neu.map(esc).join(" · ") + '</p>' : "") +
      (lv === 0 ? '<p>' + esc(tx.raubIntro) + '</p>' : "") +
      '<p class="eh-klein">' + esc(tx.leben(S.leben)) + ' · ' + S.punkte + ' ' + esc(tx.punkte) + ' · ' + esc(tx.beutel(S.beutel)) + '</p>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="raub">' + esc(tx.los) + '</button>', "intro");
    zeichnen(performance.now());
  }

  function nachRaubZeigen(nurNeu) {
    const tx = t(), R = S.R;
    zustand = "tafel";
    const extra = Math.round(R.gier * 2);
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
      '<p>' + esc(tx.abwehrIntro) + '</p>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="abwehr">' + esc(tx.zurAbwehr) + '</button>', "nachRaub");
    if (!nurNeu) KLANG.gold();
  }

  function ergebnisZeigen(nurNeu) {
    const tx = t();
    if (!nurNeu) {
      const A = S.A, R = S.R;
      zustand = "tafel";
      if (A.verloren) {
        S.leben--;
        S.erg = { verloren: true };
        KLANG.verloren();
        if (S.leben <= 0) { loesch(SPEICHER); spielEnde(); return; }
        speichern();
      } else {
        const gesichert = Math.max(0, Math.round(A.hort - A.reserve));
        const faktor = 1 + 0.15 * R.gier;
        const pkt = Math.round(gesichert * faktor) + A.punkte;
        const insBeutel = Math.round(gesichert * 0.5);
        S.punkte += pkt; S.beutel += insBeutel; S.goldGesamt += gesichert;
        S.erg = { verloren: false, gesichert, insBeutel, faktor, erlegt: A.erlegt, pkt, sieg: S.lv === KAMPAGNE - 1 };
        S.lv++;
        speichern();
      }
    }
    const E = S.erg;
    if (E.verloren) {
      schleierAuf('<h4>' + esc(tx.verloren) + '</h4><p>' + esc(tx.verlorenText(S.leben)) + '</p>' +
        '<button type="button" class="tav-knopf eh-haupt" data-tun="wiederholen">' + esc(tx.nochmalLevel) + '</button>' +
        '<button type="button" class="eh-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>', "ergebnis");
      return;
    }
    schleierAuf(
      '<h4>' + esc(E.sieg ? tx.sieg : tx.sicher) + '</h4>' +
      (E.sieg ? '<p class="eh-erzaehl">' + esc(tx.siegText) + '</p>' : "") +
      '<dl class="eh-werte">' +
      '<dt>' + esc(tx.ergWerte.gesichert) + '</dt><dd>💰 ' + E.gesichert + '</dd>' +
      '<dt>' + esc(tx.ergWerte.gier) + '</dt><dd>×' + E.faktor.toFixed(2) + '</dd>' +
      '<dt>' + esc(tx.ergWerte.erlegt) + '</dt><dd>' + E.erlegt + '</dd>' +
      '<dt>' + esc(tx.ergWerte.punkte) + '</dt><dd>+' + E.pkt + '</dd>' +
      '<dt>' + esc(tx.ergWerte.beutel) + '</dt><dd>💰 +' + E.insBeutel + '</dd>' +
      '</dl>' +
      '<p class="eh-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + '</span></p>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="hain">' + esc(tx.zumHain) + '</button>', "ergebnis");
  }

  function hainZeigen() {
    const tx = t();
    zustand = "tafel";
    const gruppen = ["raub", "wesen", "abwehr"].map(gr => {
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
      '<p class="eh-beutel">💰 ' + esc(tx.beutel(S.beutel)) + '</p>' +
      '<div class="eh-hain">' + gruppen + '</div>' +
      '<button type="button" class="tav-knopf eh-haupt" data-tun="weiterLevel">' + esc(tx.weiter) + '</button>', "hain");
  }
  function kaufen(k) {
    const u = UPS[k], st = S.up[k] || 0;
    if (st >= u.kosten.length || S.beutel < u.kosten[st]) return;
    if (k === "heilkraut" && S.leben >= MAX_LEBEN) return;
    S.beutel -= u.kosten[st]; S.up[k] = st + 1;
    if (k === "heilkraut") S.leben++;
    KLANG.kaufen(); speichern();
    const scroll = schleier.scrollTop;
    hainZeigen(); schleier.scrollTop = scroll;
  }

  function pauseZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.pause) + '</h4><p>' + esc(tx.pauseText) + '</p><button type="button" class="tav-knopf eh-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>' +
      '<button type="button" class="eh-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>', "pause");
  }

  function spielEnde(nurNeu) {
    const tx = t();
    if (!nurNeu) {
      zustand = "ende";
      loesch(SPEICHER);
      KLANG.verloren();
      const alt = parseInt(lies(rekordKey(S.stufe), "0"), 10);
      S.neuerRekord = S.punkte > alt && S.punkte > 0;
      if (S.neuerRekord) schreib(rekordKey(S.stufe), String(S.punkte));
      S.altRekord = alt;
      S.spruchStufe = S.lv >= KAMPAGNE ? "legende" : S.lv >= 15 ? "boss" : S.lv >= 9 ? "gut" : S.lv >= 3 ? "mittel" : "schwach";
      S.spruchIdx = Math.floor(Math.random() * 3);
      S.eingetragen = ""; S.sendet = false;
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

  function losSpielen() { zustand = "spiel"; schleierZu(); anwerfen(); }

  function tafelKlick(e) {
    const st = e.target.closest("[data-stufe]");
    if (st && zustand === "start") {
      stufeWahl = st.dataset.stufe; schreib("imres-echohort-stufe", stufeWahl);
      startZeigen(); fussSetzen(); bestenLaden(stufeWahl);
      return;
    }
    const kb = e.target.closest("[data-kauf]");
    if (kb && tafelArt === "hain") { kaufen(kb.dataset.kauf); return; }
    if (e.target.closest(".eh-eintragen")) { eintragen(); return; }
    const b = e.target.closest("[data-tun]"); if (!b) return;
    const tun = b.dataset.tun;
    audio();
    if (tun === "neu") { loesch(SPEICHER); neuesSpiel(); fussSetzen(); bestenLaden(S.stufe); introZeigen(); }
    else if (tun === "fortsetzen") { const sp = gespeichert(); if (!sp) { startZeigen(); return; } laden(sp); fussSetzen(); bestenLaden(S.stufe); if (S.lv > 0) hainZeigen(); else introZeigen(); }
    else if (tun === "raub") { raubzugStarten(); losSpielen(); }
    else if (tun === "abwehr") { abwehrStarten(); losSpielen(); }
    else if (tun === "hain") hainZeigen();
    else if (tun === "weiterLevel") introZeigen();
    else if (tun === "wiederholen") introZeigen();
    else if (tun === "weiter") losSpielen();
    else if (tun === "beenden") spielEnde();
    else if (tun === "nochmal") { zustand = "start"; S = null; hgSchluessel = ""; startZeigen(); fussSetzen(); bestenLaden(stufeWahl); anwerfen(); }
  }

  function pausieren() {
    if (zustand !== "spiel") return;
    zustand = "pause";
    pauseZeigen();
  }

  /* ---------- Bestenliste: gemeinsam über Supabase, sonst auf diesem Gerät ---------- */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    return fetch(SERVER.url + pfad, body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) })
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status));
  }
  const besten = {}, serverOk = {}; let meinEintrag = null;
  const lokalLesen = () => { try { return JSON.parse(localStorage.getItem("imres-echohort-liste") || "{}") || {}; } catch (_) { return {}; } };
  const sortieren = l => l.sort((a, b) => b.punkte - a.punkte || b.level - a.level || String(a.erstellt).localeCompare(String(b.erstellt)));
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
    return '<div class="eh-eintrag"><input type="text" class="eh-name" maxlength="24" autocomplete="nickname" placeholder="' + esc(T.deinName) + '" value="' + esc(name) + '">' +
      '<button type="button" class="tav-knopf eh-eintragen"' + (S.sendet ? " disabled" : "") + ">" + esc(T.eintragen) + "</button></div>";
  }
  function eintragen() {
    if (!S || zustand !== "ende" || S.eingetragen || S.sendet) return;
    const feld = tafel.querySelector(".eh-name"), name = feld ? feld.value.trim().slice(0, 24) : "";
    if (!name) { if (feld) feld.focus(); return; }
    schreib("imres-echohort-name", name);
    const T = t(), st = S.stufe, spiel = S;
    const e = { name, punkte: S.punkte, level: S.lv + 1, erstellt: new Date().toISOString() };
    const lok = lokalLesen(); lok[st] = sortieren((lok[st] || []).concat([e])).slice(0, 10);
    schreib("imres-echohort-liste", JSON.stringify(lok));
    spiel.sendet = true;
    server("/rest/v1/rpc/hort_eintragen", { p_name: name, p_stufe: st, p_punkte: e.punkte, p_level: e.level })
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
  function knopfDruck(id) {
    if (S.phase === "raub") {
      if (id.startsWith("form:")) formWaehlen(id.slice(5));
      else if (id === "genug") genug();
    } else {
      if (id.startsWith("bau:")) { const k = id.slice(4); if (S.A.bauTyp === k) bauen(k); else { S.A.bauTyp = k; KLANG.griff(); } }
      else if (id === "pflanzen") bauen(S.A.bauTyp);
      else if (id === "staerker") verstaerken();
      else if (id === "raus") ausreissen();
      else if (id === "jetzt") { S.A.vorT = 0.01; }
    }
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
.eh-liste { width: 100%; max-width: min(100%, calc(76vh * .8)); justify-self: center; }
.eh-liste:empty { display: none; }
.eh-liste h4 { font-family: var(--display); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .2rem 0 .4rem; font-weight: 400; }
.eh-liste table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.eh-liste th { text-align: left; font-weight: normal; color: var(--ash); font-size: .75rem; border-bottom: 1px solid var(--line); padding: .25rem .4rem; }
.eh-liste td { padding: .3rem .4rem; border-bottom: 1px solid rgba(235,226,204,.06); }
.eh-liste td:nth-child(3), .eh-liste th:nth-child(3), .eh-liste td:nth-child(4), .eh-liste th:nth-child(4) { text-align: right; }
.eh-liste tr.mein td { color: var(--ember); }
.eh-leer { color: var(--ash); font-size: .85rem; font-style: italic; margin: .3rem 0 0; }
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
  startZeigen();
  if (window.ResizeObserver) new ResizeObserver(groesse).observe(buehne); else window.addEventListener("resize", groesse);
  groesse();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => zeichnen(performance.now()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(eintraege => {
      sichtbar = eintraege[0].isIntersecting;
      if (sichtbar) anwerfen(); else pausieren();
    }, { threshold: 0.15 }).observe(buehne);
  } else { sichtbar = true; anwerfen(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausieren(); else anwerfen(); });
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); texteSetzen(); zeichnen(performance.now()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (/eh-test/.test(location.hash + location.search)) window.__echohort = { set tempo(v) { testTempo = v; }, get S() { return S; }, set S(v) { S = v; }, get zustand() { return zustand; }, raubzugStarten, abwehrStarten, raubzugEnde, ergebnisZeigen, hainZeigen, introZeigen, neuesSpiel, KAMPAGNE, FEINDE, feindNeu };
})();
