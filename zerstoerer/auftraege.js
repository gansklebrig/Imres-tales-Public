/* Ezekiel – The Destroyer · W28 Lager: Aufträge der Lagerbewohner
   Jeder wichtige Bewohner vergibt kleine Aufgaben mit eigener Stimme (Friedrich knapp und jägerisch, Echo naturverbunden
   und goldgierig, Barradin in Reimen, Nundro mürrisch, Edda genau, Quirin begeistert, Sigrun orakelhaft …).
   - Höchstens 3 aktive Aufträge, je Bewohner einer. Annehmen / Ablehnen (bis zum nächsten Lagerbesuch) / Tauschen gegen
     einen aktiven Auftrag – im Fenster beim Bewohner. Erledigte Aufträge belegen ihren Platz, bis man die Belohnung abholt.
   - Gestaffelt nach Fortschritt (Stufe 0–3) und nur mit Inhalten, die der Spieler schon kennt (Fundbuch, Gebiete, Bosse).
   - Ketten: Friedrich, Echo, Barradin, Nundro, Edda und Wendel erzählen über 3–4 Stufen eine kleine Geschichte; der Abschluss
     schaltet einen Erfolg mit Titel und Umhang frei und hinterlässt eine Spur im Lager (lagerwelt.js liest Z.auftr.chainDone).
   - Fortschritt dezent im HUD (abschaltbar: Z.settings.auftrHud) und im Pausemenü; Abschluss-Fanfare über Z.music.stinger.
   - Zählung über Ereignisse (Kills über Z.killEnemy, Zähler-Differenzen aus Z.stats / Z.achRun / Z.meta, Gebiets- und
     Bosskampf-Abschluss). Koop (W27): Schaden aller Figuren in Z.players zählt, Kills zählen unabhängig vom Spieler.
   Speicher: Z.meta.auftr (je Spielstand; fehlt bei alten Ständen und wird leer angelegt). Farben: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, A = Z.audio, L = v => Z.L(v);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const M = () => Z.meta;
  const S = () => Z.stats || {};
  const ui = () => Z.ui || {};
  const lo = () => !!(Z.gq && Z.gq.level === 0);
  const MAX_AKT = 3;

  /* ======================= BEWOHNER, DIE AUFTRÄGE VERGEBEN ======================= */
  /* npc: Figur im Kern des Lagers (Z.level.props), res: Bewohner aus lager.js (Z.lager.has) */
  const GIVER = {
    friedrich: { n: "Friedrich", r: ["Waldläufer", "Ranger"], npc: "G", col: "#6a8a3a",
      hi: [["Friedrich. Hast du Zeit? Gut. Ich hab Arbeit.", "Friedrich. Got time? Good. I've got work."], ["Rex hat Witterung. Ich auch.", "Rex has a scent. So do I."], ["Leise. Da draußen hört alles mit.", "Quiet. Everything out there is listening."]],
      none: [["Nichts zu tun. Dann schärf deine Pfeile.", "Nothing to do. Then sharpen your arrows."], ["Heute keine Fährte. Morgen vielleicht.", "No trail today. Maybe tomorrow."]] },
    echo: { n: "Echo", r: ["Druidin", "Druid"], npc: "E", col: "#8aa03a",
      hi: [["Die Wurzeln flüstern deinen Namen. Und etwas von Gold.", "The roots whisper your name. And something about gold."], ["Setz dich. Nein, nicht auf den Salbei.", "Sit down. No, not on the sage."], ["Alles wächst. Auch mein Vermögen, wenn du mir hilfst.", "Everything grows. So does my fortune, if you help me."]],
      none: [["Heute nichts. Der Mond steht falsch.", "Nothing today. The moon is in the wrong place."], ["Lass mich. Ich rede gerade mit dem Moos.", "Leave me be. I'm talking to the moss."]] },
    barradin: { n: "Barradin", r: ["Barde", "Bard"], npc: "B", res: "lied", col: "#a04aa0",
      hi: [["Tritt näher, mein Held, und hör, was ich sag – ich hab Arbeit für dich, und ein Lied für den Tag!", "Step closer, my hero, and hear what I say – I've work for you, friend, and a song for the day!"], ["Ein Lied ohne Taten ist Wind ohne Segel – drum bring mir Geschichten, und zwar nach der Regel!", "A song without deeds is a wind with no sail – so bring me some stories, and make them a tale!"]],
      none: [["Heut hab ich nichts, das sich lohnt zu besingen – geh, mach was Großes, dann lass ich es klingen!", "Today there is nothing that's worth a refrain – go do something grand, then I'll sing it again!"]] },
    nundro: { n: "Nundro", r: ["Schmied", "Smith"], npc: "A", col: "#c86a2a",
      hi: [["Was? … Ach, du. Hier. Arbeit.", "What? … Oh, you. Here. Work."], ["Red nicht. Hör zu.", "Don't talk. Listen."], ["Der Amboss wartet nicht. Ich auch nicht.", "The anvil doesn't wait. Neither do I."]],
      none: [["Nichts. Geh. Ich schmiede.", "Nothing. Go. I'm forging."], ["Wenn ich was brauch, ruf ich. Laut.", "If I need something, I'll shout. Loudly."]] },
    edda: { n: "Edda", r: ["Kartografin", "Cartographer"], res: "edda", col: "#c8902a",
      hi: [["Meine Karte hat Lücken. Du hast Beine. Wir passen gut zusammen.", "My map has gaps. You have legs. We fit together nicely."], ["Jeder Raum, den du betrittst, ist ein Strich weniger, den ich raten muss.", "Every room you enter is one line less I have to guess."]],
      none: [["Gerade nichts. Ich zeichne nach, was du schon gelaufen bist.", "Nothing right now. I'm tracing what you've already walked."]] },
    quirin: { n: "Quirin", r: ["Alchemist", "Alchemist"], res: "quirin", col: "#8aa040",
      hi: [["Ah! Ein Versuchs– äh, ein Freund! Ich hätte da ein Experiment.", "Ah! A test sub– er, a friend! I have an experiment."], ["Riechst du das? Das ist Fortschritt. Oder Schwefel.", "Smell that? That's progress. Or sulphur."]],
      none: [["Die Ergebnisse sind noch … am Blubbern. Komm später.", "The results are still… bubbling. Come back later."]] },
    sigrun: { n: "Sigrun", r: ["Runenleserin", "Rune reader"], res: "sigrun", col: "#a04a8a",
      hi: [["Die Steine haben dich kommen sehen. Sie haben eine Bitte.", "The stones saw you coming. They have a request."], ["Jede Rune will etwas. Diese will dich.", "Every rune wants something. This one wants you."]],
      none: [["Die Steine schweigen heute. Das ist auch eine Antwort.", "The stones are silent today. That is an answer, too."]] },
    wendel: { n: "Wendel", r: ["Bestienmeister", "Beastmaster"], res: "wendel", col: "#9a6a3a",
      hi: [["Die Tiere da drin sind nicht böse. Nur verwirrt. Wie Barradin.", "The animals in there aren't evil. Just confused. Like Barradin."], ["Rex sagt, du riechst nach Abenteuer. Und nach Goblin.", "Rex says you smell of adventure. And goblin."]],
      none: [["Rex schläft. Ich auch gleich. Später.", "Rex is asleep. I will be too. Later."]] },
    jori: { n: "Jori", r: ["Schmiedelehrling", "Smith's apprentice"], res: "jori", col: "#c87a3a",
      hi: [["Psst! Nicht Nundro sagen – ich hab einen eigenen Auftrag für dich!", "Psst! Don't tell Nundro – I've got a job of my own for you!"], ["Ich will wissen, ob mein Schliff hält. Du bist mein Prüfstein!", "I want to know if my edge holds. You're my whetstone!"]],
      none: [["Ich muss erst den Ständer fertig machen. Sagt Nundro.", "I have to finish the rack first. Says Nundro."]] },
    alwin: { n: "Alwin", r: ["Chronist", "Chronicler"], res: "alwin", col: "#b08a4a",
      hi: [["Meine Chronik hat leere Seiten. Füll sie mir.", "My chronicle has empty pages. Fill them for me."], ["Ich brauche Stoff, junger Zerstörer. Die Leser verlangen Blut. Und Fußnoten.", "I need material, young Destroyer. Readers demand blood. And footnotes."]],
      none: [["Ich schreibe gerade ab, was du schon getan hast. Das dauert.", "I'm copying out what you've already done. It takes a while."]] },
    lotte: { n: "Lotte", r: ["Händlerin", "Trader"], res: "lotte", col: "#d04a2a",
      hi: [["Ein Geschäft! Du arbeitest, ich zahle. Fast fair.", "A deal! You work, I pay. Almost fair."], ["Für dich hab ich immer ein Angebot. Meistens ein gutes.", "I always have an offer for you. Usually a good one."]],
      none: [["Keine Aufträge, keine Rabatte. Komm wieder, wenn der Markt sich dreht.", "No jobs, no discounts. Come back when the market turns."]] },
    mira: { n: "Mira", r: ["Kartenzeichnerin", "Mapmaker"], res: "mira", col: "#c03a5a",
      hi: [["Für jeden, den ich verloren habe, gibt es noch etwas zu tun. Hilfst du mir?", "For everyone I lost there's still something to do. Will you help me?"]],
      none: [["Heute will ich nur am Feuer sitzen. Bleib ein bisschen.", "Today I just want to sit by the fire. Stay a while."]] }
  };
  Z.AUFTR_GIVER = GIVER;

  /* ======================= GRUPPEN UND WISSEN ======================= */
  const GRP = {
    goblin: id => /^goblin/.test(id),
    tier: id => ["wolf", "wolfsreiter", "ratte", "magmaHund", "stirge", "krabbe", "glutfledermaus", "salamander", "rochen"].includes(id),
    untot: (id, d) => !!(d && d.undead),
    spinne: id => ["riesenspinne", "netzspinne", "spinnchen", "ettercap", "drider", "brutsack"].includes(id),
    robe: id => /^robe/.test(id) || id === "adept",
    wasser: id => ["kuotoa", "kuotoaSpeer", "peitscher", "ertrunkener", "grindylow"].includes(id),
    gewaechs: id => ["zweigBlight", "nadelBlight", "rankenBlight", "myconid"].includes(id),
    mini: id => /^mb_/.test(id)
  };
  const seenGrp = g => { const s = M().seen || {}; return Object.keys(s).some(id => s[id] > 0 && GRP[g](id, Z.ENEMIES && Z.ENEMIES[id])); };
  const achZ = () => M().achZ || {};
  const visited = b => !!((achZ().bio || {})[b]);
  const bossSeen = id => !!((M().bosses || {})[id]);
  const bossWon = id => !!((M().bosses || {})[id] && M().bosses[id].won > 0);
  const anyBossWon = () => Object.keys(M().bosses || {}).some(bossWon);
  const foundCls = cls => Object.keys(M().found || {}).some(id => Z.WEAPONS[id] && Z.upClass && Z.upClass(Z.WEAPONS[id]) === cls);
  /* Fortschrittsstufe: 0 von Anfang an · 1 nach dem ersten Lauf oder in Stufe-1-Gebieten · 2 nach einem Bosssieg oder in Stufe-2-Gebieten · 3 nach einem Ende oder in den Tiefen */
  function tier() {
    const m = M(), B = Z.BIOMES || {}, v = Object.keys(achZ().bio || {});
    const vt = v.reduce((a, b) => Math.max(a, (B[b] && B[b].tier) || 0), 0);
    if (Object.keys(m.endings || {}).length || vt >= 4) return 3;
    if (anyBossWon() || vt >= 2) return 2;
    if ((m.runs || 0) >= 1 || vt >= 1) return 1;
    return 0;
  }

  /* ======================= DIE AUFTRÄGE ======================= */
  /* id, g (Bewohner), st (Stufe), ev (Ereignis), f (Filter), n (Ziel), run (in einem Lauf), max (Höchstwert statt Summe),
     t (Aufgabe), o (Angebot in der Stimme des Bewohners), d (Dank), r (Belohnung: sh Splitter, glut Glut für den nächsten Lauf,
     cape, lore [Titel, Text]), ch (Kette, Stufe), req (Wissen) */
  const RW = (sh, x) => Object.assign({ sh }, x || {});
  const lore = (tde, ten, de, en) => ({ lore: [[tde, ten], [de, en]] });
  const Q = [];
  const q = o => Q.push(o);
  /* ---------- Friedrich: Die große Jagd ---------- */
  q({ id: "f_bogen", g: "friedrich", st: 0, ch: ["jagd", 0], ev: "kill", f: k => k.goblin && k.fern, n: 15, req: () => seenGrp("goblin"),
    t: ["Erlege 15 Goblins mit Fernwaffen.", "Bring down 15 goblins with ranged weapons."],
    o: ["Goblins. Fünfzehn. Aus der Ferne. Wer zu nah rangeht, riecht danach eine Woche nach Goblin.", "Goblins. Fifteen. From a distance. Get too close and you smell of goblin for a week."],
    d: ["Saubere Schüsse. Rex hat nichts mehr gefunden, das zappelt.", "Clean shots. Rex found nothing still twitching."],
    r: RW(40, lore("Friedrichs erster Bogen", "Friedrich's first bow", "Den ersten Bogen hat mir mein Vater aus Eibe geschnitzt. Zu groß für mich. Ich hab ein Jahr lang nur Bäume getroffen. Dann einen Hasen. Dann hab ich geweint, weil der Hase tot war. Vater hat gesagt: Gut so. Wer nicht mehr weint, soll nicht mehr jagen.", "My father carved my first bow from yew. Too big for me. For a year I only hit trees. Then a hare. Then I cried because the hare was dead. Father said: good. Whoever stops crying should stop hunting.")) });
  q({ id: "f_falke", g: "friedrich", st: 1, ch: ["jagd", 1], ev: "dive", n: 8,
    t: ["Erledige 8 Gegner mit Sturzangriffen.", "Finish 8 enemies with plunge attacks."],
    o: ["Von oben. Wie der Falke. Acht Stück. Der Boden fängt dich schon.", "From above. Like the falcon. Eight of them. The ground will catch you."],
    d: ["Falke. Hab ich doch gesagt.", "Falcon. Told you."],
    r: RW(45, lore("Der Falke über dem Moor", "The falcon over the moor", "Im Moor hinter Imres gab es einen Falken, der nie verfehlt hat. Ich hab drei Sommer lang zugesehen. Er wartet nicht auf die Beute. Er wartet auf den Moment, in dem die Beute vergisst, nach oben zu schauen.", "In the moor behind Imres there was a falcon that never missed. I watched it for three summers. It doesn't wait for the prey. It waits for the moment the prey forgets to look up.")) });
  q({ id: "f_pirsch", g: "friedrich", st: 1, ch: ["jagd", 2], ev: "surp", n: 5, run: true,
    t: ["Überrumple 5 Gegner in einem Lauf (von hinten oder im Schlaf).", "Catch 5 enemies off guard in one run (from behind or asleep)."],
    o: ["Leise rein. Fünf, die dich nicht kommen sehen. In einem Lauf. Wind von vorn.", "Go in quiet. Five that never see you coming. In one run. Wind in your face."],
    d: ["Keiner hat dich gehört. Nicht mal ich.", "Nobody heard you. Not even me."],
    r: RW(50, lore("Warum Rex bellt", "Why Rex barks", "Rex bellt nie, wenn er jagt. Nur, wenn er Angst hat, dass ich zu weit weg bin. In der Feste hat er die ganze erste Nacht gebellt. Seitdem schlafe ich mit einer Hand auf seinem Rücken.", "Rex never barks when he hunts. Only when he's afraid I'm too far away. In the keep he barked the whole first night. Since then I sleep with one hand on his back.")) });
  q({ id: "f_bugbear", g: "friedrich", st: 2, ch: ["jagd", 3], ev: "boss", f: d => d.id === "bugbear", n: 1, req: () => bossSeen("bugbear"),
    t: ["Besiege den Bugbear.", "Defeat the Bugbear."],
    o: ["Der Bugbear. Er hat meine Fallen gefressen. Mit den Hasen drin. Ich will seinen Schädel über meiner Tür.", "The Bugbear. He ate my traps. With the hares in them. I want his skull above my door."],
    d: ["… Der hängt gut. Danke. Wirklich.", "… That hangs nicely. Thank you. Really."],
    r: RW(80, Object.assign({ glut: 2 }, lore("Die große Jagd", "The great hunt", "Ich bin kein Held. Helden wollen, dass man über sie singt. Ich will nur, dass Rex satt ist und dass keiner, der mit mir loszieht, allein zurückkommt. Du bist zurückgekommen. Jedes Mal. Das ist mehr wert als jeder Schädel. Aber der Schädel bleibt hängen.", "I'm no hero. Heroes want songs about them. I just want Rex fed and nobody who leaves with me to come back alone. You came back. Every time. That's worth more than any skull. But the skull stays up."))) });
  q({ id: "f_roll", g: "friedrich", st: 0, ev: "dodge", n: 10,
    t: ["Weiche 10 Angriffen perfekt aus.", "Perfectly dodge 10 attacks."],
    o: ["Ein Hirsch bleibt nicht stehen, wenn der Pfeil kommt. Du auch nicht. Zehnmal.", "A stag doesn't stand still when the arrow comes. Neither do you. Ten times."],
    d: ["Flink. Fast wie ein Hirsch. Fast.", "Nimble. Almost like a stag. Almost."], r: RW(30) });
  q({ id: "f_elite", g: "friedrich", st: 1, ev: "kill", f: k => k.elite, n: 5,
    t: ["Erledige 5 Elite-Gegner.", "Finish 5 elite enemies."],
    o: ["Die Starken. Die mit dem Glühen. Fünf. Das Rudel wird ruhiger, wenn die Leittiere fehlen.", "The strong ones. The ones that glow. Five. The pack calms down when the leaders are gone."],
    d: ["Das Rudel hat's gemerkt.", "The pack noticed."], r: RW(45) });
  q({ id: "f_wehrgang", g: "friedrich", st: 2, ev: "area", f: d => d.id === "wehrgang" && d.nohit, n: 1, req: () => visited("wehrgang"),
    t: ["Durchquere den Wehrgang ohne einen Treffer.", "Cross the ramparts without taking a hit."],
    o: ["Der Wehrgang. Einmal durch, kein Kratzer. Wie ein Fuchs durch die Hecke.", "The ramparts. Once through, not a scratch. Like a fox through a hedge."],
    d: ["Fuchs. Hab ich mir gedacht.", "Fox. Thought so."], r: RW(70) });
  /* ---------- Echo: Echos Garten ---------- */
  q({ id: "e_gold", g: "echo", st: 0, ch: ["garten", 0], ev: "gold", n: 400,
    t: ["Sammle 400 Gold.", "Collect 400 gold."],
    o: ["Gold wächst nicht auf Bäumen. Leider. Bring mir 400 – für … Saatgut. Ja. Saatgut.", "Gold doesn't grow on trees. Sadly. Bring me 400 – for… seeds. Yes. Seeds."],
    d: ["Oh, wie das glänzt. Wie Tau. Wie sehr teurer Tau.", "Oh, how it shines. Like dew. Like very expensive dew."],
    r: RW(35, lore("Echos erstes Beet", "Echo's first bed", "Im Hain meiner Mutter durfte ich nie etwas pflanzen. Ich hätte die Ordnung gestört, sagten die Ältesten. Also habe ich heimlich Münzen vergraben, um zu sehen, ob sie wachsen. Sie wuchsen nicht. Aber ich hatte etwas, das nur mir gehörte.", "In my mother's grove I was never allowed to plant anything. I'd disturb the order, the elders said. So I secretly buried coins to see if they would grow. They didn't. But I had something that was only mine.")) });
  q({ id: "e_erde", g: "echo", st: 1, ch: ["garten", 1], ev: "kill", f: k => k.umg, n: 8,
    t: ["Erledige 8 Gegner durch Fallen, Abgründe oder Wände.", "Finish 8 enemies with traps, chasms or walls."],
    o: ["Die Erde nimmt, was fällt. Lass sie arbeiten: acht in Abgründe, Fallen, gegen Wände. Sie ist hungrig.", "The earth takes what falls. Let her work: eight into chasms, traps, against walls. She's hungry."],
    d: ["Die Erde ist satt. Ich hör sie summen.", "The earth is full. I can hear her humming."],
    r: RW(40, lore("Was die Wurzeln wissen", "What the roots know", "Wurzeln wissen, wo Wasser ist, lange bevor es regnet. Ich habe einmal drei Tage mit dem Ohr am Boden gelegen. Danach wusste ich, wo das Wasser ist. Und dass Barradin nachts schnarcht. Laut. Durch die Erde.", "Roots know where water is long before it rains. I once lay with my ear to the ground for three days. Afterwards I knew where the water was. And that Barradin snores at night. Loudly. Through the earth.")) });
  q({ id: "e_geheim", g: "echo", st: 1, ch: ["garten", 2], ev: "geheimnis", n: 3,
    t: ["Finde 3 Geheimnisse.", "Find 3 secrets."],
    o: ["Der Wald versteckt seine besten Pilze. Die Feste ihre besten Kammern. Drei, bitte. Und was drin glänzt.", "The forest hides its best mushrooms. The keep its best chambers. Three, please. And whatever glitters inside."],
    d: ["Siehst du? Wer lauscht, findet.", "See? Whoever listens, finds."],
    r: RW(40, lore("Die Hörner", "The horns", "Die Hörner kamen in meinem zwölften Winter. Erst juckte es, dann wuchsen sie, und die anderen Kinder liefen weg. Nur eine Ziege blieb. Sie hat mich angestoßen, Horn an Horn. Ich glaube, das war meine erste Freundin.", "The horns came in my twelfth winter. First it itched, then they grew, and the other children ran away. Only a goat stayed. She butted me, horn to horn. I think she was my first friend.")) });
  q({ id: "e_reich", g: "echo", st: 2, ch: ["garten", 3], ev: "gold", n: 600, run: true,
    t: ["Sammle 600 Gold in einem Lauf.", "Collect 600 gold in one run."],
    o: ["Jetzt das große Beet. Sechshundert Gold in einem Lauf – und ich pflanze uns einen Garten, den sogar die Feste beneidet.", "Now the big bed. Six hundred gold in one run – and I'll plant us a garden even the keep will envy."],
    d: ["Mein Garten! Unser Garten. Na gut: mein Garten, aber du darfst gießen.", "My garden! Our garden. Fine: my garden, but you may water it."],
    r: RW(70, lore("Echos Garten", "Echo's garden", "Ich habe den Garten nicht für mich gepflanzt. Na gut, auch. Aber vor allem für die, die zurückkommen. Wer aus der Feste kommt, soll als Erstes etwas Lebendiges sehen. Und dann mich. Und dann vielleicht eine kleine Rechnung für die Kräuter.", "I didn't plant the garden for myself. Fine, also. But mostly for those who come back. Whoever comes out of the keep should see something alive first. And then me. And then perhaps a small bill for the herbs.")) });
  q({ id: "e_heil", g: "echo", st: 0, ev: "area", f: d => d.voll, n: 1,
    t: ["Verlasse ein Gebiet mit vollem Leben.", "Leave an area at full health."],
    o: ["Ein Baum, der heil bleibt, wächst. Verlass ein Gebiet mit vollem Leben. Ganz. Nicht fast.", "A tree that stays whole grows. Leave an area at full health. Full. Not almost."],
    d: ["Heil wie junge Rinde.", "Whole as young bark."], r: RW(30) });
  q({ id: "e_wasser", g: "echo", st: 2, ev: "kill", f: k => k.wasser, n: 12, req: () => seenGrp("wasser"),
    t: ["Erledige 12 Kuo-Toa oder Ertrunkene.", "Finish 12 Kuo-toa or Drowned Ones."],
    o: ["Der Hafen stinkt nach falschem Wasser. Zwölf von den Fischköpfen, bitte. Die Frösche danken es dir.", "The harbour stinks of wrong water. Twelve of those fishheads, please. The frogs will thank you."],
    d: ["Das Wasser atmet wieder.", "The water breathes again."], r: RW(55) });
  q({ id: "e_wuchs", g: "echo", st: 3, ev: "kill", f: k => k.gewaechs, n: 10, req: () => seenGrp("gewaechs"),
    t: ["Erledige 10 verdorbene Gewächse (Blights, Myconide).", "Finish 10 corrupted growths (blights, myconids)."],
    o: ["Da unten wachsen Dinge, die nicht wachsen sollten. Zehn. Schneid sie zurück. Ich mach Kompost draus.", "Down there things grow that shouldn't. Ten. Cut them back. I'll make compost."],
    d: ["Guter Kompost. Riecht nach Rache.", "Good compost. Smells of revenge."], r: RW(70) });
  /* ---------- Barradin: Die Ballade vom Zerstörer (reimt) ---------- */
  q({ id: "b_parade", g: "barradin", st: 0, ch: ["ballade", 0], ev: "parry", n: 10,
    t: ["Pariere 10 Angriffe.", "Parry 10 attacks."],
    o: ["Ein Held, der pariert, wird besungen, geehrt – zehn Paraden, mein Freund, dann ist die Strophe was wert!", "A hero who parries is honoured in song – ten parries, my friend, and the verse won't be long!"],
    d: ["Klirr, klang, die Klinge kam nicht durch – die erste Strophe steht, so fest wie 'ne Burg!", "Clang, clash, the blade could not get through – the first verse stands, and it's thanks to you!"],
    r: RW(35, lore("Strophe I", "Verse I", "Er kam aus der Glut mit den Hörnern voran, / kein Schwert in der Hand, doch ein Wille, ein Bann. / Sie schlugen und stachen, er stand wie ein Turm – / so fängt sie an, die Ballade vom Sturm.", "He came from the embers, his horns to the fore, / no sword in his hand, but a will, and what's more: / they struck and they stabbed, but he stood like a tower – / and so starts the ballad of storm and of power.")) });
  q({ id: "b_serie", g: "barradin", st: 1, ch: ["ballade", 1], ev: "serie", n: 8, max: true, run: true,
    t: ["Schaffe eine Kill-Serie von 8.", "Reach a kill streak of 8."],
    o: ["Acht auf einen Streich, ohne Pause, ohne Ruh – die zweite Strophe, mein Freund, die schreibst du!", "Eight in a row, with no rest and no break – the second verse, friend, is yours to make!"],
    d: ["Acht! Ich hab mitgezählt – auf den Fingern, mit Not. Die zweite Strophe klingt nach Abendrot!", "Eight! I kept count – on my fingers, with strain. The second verse sings like a sunset in rain!"],
    r: RW(40, lore("Strophe II", "Verse II", "Acht fielen im Takt, wie ein Trommelgedicht, / der Zerstörer, er tanzte, er zögerte nicht. / Ein Barde stand fern und hat alles gesehn – / na gut, aus dem Lager. Doch es war wunderschön.", "Eight fell to the beat like a drummer's refrain, / the Destroyer, he danced, never paused once again. / A bard stood afar and saw all that occurred – / well, from camp. But I swear it was grand, every word.")) });
  q({ id: "b_geschoss", g: "barradin", st: 1, ch: ["ballade", 2], ev: "parryProj", n: 6, req: () => foundCls("schild"),
    t: ["Pariere 6 Geschosse mit einem Schild.", "Parry 6 projectiles with a shield."],
    o: ["Pfeile, die fliegen, und Bolzen, die schwirren – pariere sechs Stück, lass die Schützen sich irren!", "Arrows that fly and bolts that whir past – parry six of them, friend, let the archers be aghast!"],
    d: ["Zurück an den Absender, mit Gruß und mit Kuss – die dritte Strophe ist fertig, mit Schuss!", "Return to the sender, with greetings and grace – the third verse is finished, right there in their face!"],
    r: RW(45, lore("Strophe III", "Verse III", "Sie schossen von Zinnen, sie schossen vom Turm, / er hob nur den Schild, und es drehte der Sturm. / Was flog, flog zurück, wie ein Wort, das man bricht – / der Schütze verstand's, doch er mochte es nicht.", "They shot from the battlements, shot from the tower, / he raised up his shield and he turned the storm's power. / What flew, flew back home, like a word that is broken – / the archer got the message, though rudely spoken.")) });
  q({ id: "b_finale", g: "barradin", st: 2, ch: ["ballade", 3], ev: "boss", f: d => d.nopot, n: 1, req: () => anyBossWon(),
    t: ["Besiege einen Boss oder Wächter, ohne im Kampf einen Trank zu trinken.", "Defeat a boss or warden without drinking a potion during the fight."],
    o: ["Die letzte Strophe, die schwerste von allen: Ein Wächter soll fallen, kein Trank darf dir fallen!", "The final verse, friend, the hardest of all: a warden must tumble – no potion at all!"],
    d: ["Vollbracht! Die Ballade ist rund wie der Mond – ich sing sie heut Abend, und du wirst belohnt!", "It's done! The ballad is round as the moon – I'll sing it tonight, and you're rewarded soon!"],
    r: RW(75, lore("Strophe IV – Finale", "Verse IV – Finale", "Kein Trank in der Hand und kein Gott an der Seit', / so stand er dem Wächter, so stand er zum Streit. / Und fragt man im Lager, wer die Feste bezwang, / dann sagt man: der Rote. Und ich schrieb den Gesang.", "No potion in hand and no god at his side, / he faced down the warden with nothing to hide. / And if you should ask who brought down that keep, / they'll say: the red one. And I wrote it. Don't weep.")) });
  q({ id: "b_ketten", g: "barradin", st: 1, ev: "befreit", n: 2, run: true, req: () => (M().befreit || 0) >= 1,
    t: ["Befreie 2 Gefangene in einem Lauf.", "Free 2 prisoners in one run."],
    o: ["Zwei arme Seelen in Ketten und Not – befrei sie in einem Lauf, eh' der Tag wird zum Tod!", "Two wretched souls in their shackles and pain – free both in one run, so they'll walk once again!"],
    d: ["Zwei Ketten gesprengt, zwei Herzen befreit – das reimt sich auf Ruhm, und auf Dankbarkeit!", "Two chains have been broken, two hearts are set free – that rhymes with your glory, and gratitude, see!"], r: RW(55) });
  q({ id: "b_uhr", g: "barradin", st: 1, ev: "rennen", n: 1,
    t: ["Schaffe eine Zeitrennen-Kammer (Sanduhr-Sockel).", "Beat a time trial chamber (hourglass pedestal)."],
    o: ["Tick, tack, die Sanduhr, sie rinnt und sie rinnt – lauf schneller, mein Freund, als der Abendwind!", "Tick, tock, the hourglass is running, my friend – outrun the night wind before it can end!"],
    d: ["Schneller als Sand, schneller als Wind – ich hab's kaum gesehen, so geschwind!", "Faster than sand and faster than air – I barely saw you, you were hardly there!"], r: RW(45) });
  /* ---------- Nundro: Glut und Amboss (mürrisch) ---------- */
  q({ id: "n_riss", g: "nundro", st: 0, ch: ["amboss", 0], ev: "wucht", n: 3,
    t: ["Zerschlage 3 Wucht-Risse in Wänden.", "Smash 3 cracked walls."],
    o: ["Wände mit Rissen. Hau drauf. Drei. Und frag nicht, warum. Ich hab Gründe.", "Walls with cracks. Hit them. Three. And don't ask why. I have reasons."],
    d: ["Hm. Guter Schlag. Für einen Gehörnten.", "Hm. Good swing. For a horned one."],
    r: RW(35, lore("Nundros Gründe", "Nundro's reasons", "Ich hör am Klang, wie ein Stein gebrochen ist. Die Feste ist mit Pfusch gebaut. Schlechte Fugen, gierige Baumeister. Jede Wand, die du einschlägst, ist eine Rechnung, die ich ihnen schreibe. Mehr musst du nicht wissen.", "I can hear by the sound how a stone has broken. The keep was built badly. Poor joints, greedy builders. Every wall you smash is a bill I write them. That's all you need to know.")) });
  q({ id: "n_wucht", g: "nundro", st: 1, ch: ["amboss", 1], ev: "kill", f: k => k.cls === "wucht", n: 30, req: () => foundCls("wucht"),
    t: ["Erledige 30 Gegner mit Wuchtwaffen (Hammer, Keule, Flegel …).", "Finish 30 enemies with heavy weapons (hammer, club, flail…)."],
    o: ["Kriegshammer. Keule. Flegel. Dreißig Köpfe. Dann reden wir. Vielleicht.", "War hammer. Club. Flail. Thirty heads. Then we'll talk. Maybe."],
    d: ["Dreißig. … Gut. Setz dich. Nicht da, da ist heiß.", "Thirty. … Good. Sit down. Not there, that's hot."],
    r: RW(50, lore("Der erste Hammer", "The first hammer", "Mein Meister hat mir meinen ersten Hammer nicht gegeben. Ich musste ihn schmieden. Mit einem Stein. Drei Wochen. Er war krumm. Ich benutze ihn heute noch. Er ist immer noch krumm. Jori hat ihn mal gerade biegen wollen. Jori fegt seitdem die Asche.", "My master didn't give me my first hammer. I had to forge it. With a rock. Three weeks. It was crooked. I still use it. It's still crooked. Jori once tried to straighten it. Jori has been sweeping ash ever since.")) });
  q({ id: "n_schmiede", g: "nundro", st: 3, ch: ["amboss", 2], ev: "area", f: d => d.id === "schmiede" && d.nohit, n: 1, req: () => visited("schmiede"),
    t: ["Durchquere die Runenschmiede ohne einen Treffer.", "Cross the rune forge without taking a hit."],
    o: ["Die Runenschmiede. Da unten hat einer meinen Beruf beleidigt. Geh durch. Ohne Kratzer. Zeig ihnen, wie Handwerk aussieht.", "The rune forge. Someone down there insulted my trade. Go through. Without a scratch. Show them what craft looks like."],
    d: ["… Ich hab einen neuen Amboss. Für dich. Sag's keinem.", "… I've got a new anvil. For you. Don't tell anyone."],
    r: RW(90, Object.assign({ glut: 3 }, lore("Glut und Amboss", "Ember and anvil", "Ich rede nicht viel, weil Reden nichts hält. Ein guter Nagel hält. Eine gute Klinge hält. Du hältst auch. Ich hab dir einen zweiten Amboss hingestellt. Für die Tage, an denen du mit krummem Stahl zurückkommst. Also für jeden Tag.", "I don't talk much because talk holds nothing. A good nail holds. A good blade holds. You hold, too. I've set up a second anvil for you. For the days you come back with bent steel. So, every day."))) });
  q({ id: "n_plus", g: "nundro", st: 1, ev: "plus", n: 3, max: true,
    t: ["Bring eine Waffe am Glutamboss auf +3.", "Raise a weapon to +3 at the ember anvil."],
    o: ["Glut, Gold, Schlag. Bring was auf plus drei. Dann weiß ich, dass du zugehört hast.", "Ember, gold, strike. Get something to plus three. Then I'll know you listened."],
    d: ["Plus drei. Nicht schlecht. Nicht gut. Nicht schlecht.", "Plus three. Not bad. Not good. Not bad."], r: RW(40, { glut: 2 }) });
  q({ id: "n_kopf", g: "nundro", st: 2, ev: "boss", f: d => d.warden && d.onlySkills, n: 1, req: () => anyBossWon(),
    t: ["Besiege einen Wächter nur mit Fähigkeiten – keine Waffe darf ihn treffen.", "Defeat a warden with skills only – no weapon may hit it."],
    o: ["Fähigkeiten. Nur Fähigkeiten. Keine Klinge, kein Bogen. Ich will sehen, ob du denken kannst.", "Skills. Only skills. No blade, no bow. I want to see if you can think."],
    d: ["Du kannst denken. Wer hätte das gedacht.", "You can think. Who'd have thought."], r: RW(80) });
  /* ---------- Edda: Wege der Feste ---------- */
  q({ id: "ed_raeume", g: "edda", st: 0, ch: ["wege", 0], ev: "area", f: d => d.allRooms, n: 1,
    t: ["Betritt jeden Raum eines Gebiets (Geheimräume zählen nicht).", "Enter every room of an area (secret rooms don't count)."],
    o: ["Ein Gebiet. Jeder Raum. Ich will keinen weißen Fleck mehr sehen. Weiße Flecken machen mich nervös.", "One area. Every room. I don't want to see a single blank spot. Blank spots make me nervous."],
    d: ["Lückenlos! Ich könnte weinen. Tu ich aber nicht. Tinte ist teuer.", "No gaps! I could cry. I won't, though. Ink is expensive."],
    r: RW(40, lore("Miras Linien", "Mira's lines", "Mira hat mir beigebracht, dass eine Karte nie die Wahrheit sagt. Sie sagt nur, was jemand gesehen hat. Deshalb zeichne ich so genau. Wenn ich schon lüge, dann mit sauberen Strichen.", "Mira taught me that a map never tells the truth. It only says what someone saw. That's why I draw so precisely. If I'm going to lie, I'll do it with clean lines.")) });
  q({ id: "ed_morsch", g: "edda", st: 1, ch: ["wege", 1], ev: "morsch", n: 3,
    t: ["Brich durch 3 morsche Böden.", "Break through 3 rotten floors."],
    o: ["Morsche Böden. Ich will wissen, was darunter ist. Spring drauf. Dreimal. Ich zeichne mit.", "Rotten floors. I want to know what's beneath. Jump on them. Three times. I'll take notes."],
    d: ["Unter dem Keller ist ein Keller. Ich hab's geahnt.", "Under the cellar there's a cellar. I knew it."],
    r: RW(40, lore("Die Karte, die nicht stimmt", "The map that's wrong", "Ich habe eine Karte der Feste, die ich nie jemandem zeige. Sie ist falsch, mit Absicht. Darauf gibt es einen Weg hinaus, der überall hinführt, nur nicht zurück hinein. Manchmal schaue ich sie an, wenn ich nicht schlafen kann.", "I have a map of the keep I never show anyone. It's wrong, on purpose. It has a way out that leads everywhere except back in. Sometimes I look at it when I can't sleep.")) });
  q({ id: "ed_raetsel", g: "edda", st: 2, ch: ["wege", 2], ev: "raetsel", n: 2,
    t: ["Löse 2 Hebelrätsel in Geheimräumen.", "Solve 2 lever puzzles in secret rooms."],
    o: ["Hebel, Gestänge, Rätsel. Die Baumeister haben gespielt. Spiel zurück – zweimal – und ich trage die Mechanik ein.", "Levers, rods, riddles. The builders were playing. Play back – twice – and I'll chart the mechanism."],
    d: ["Jetzt hab ich die Feste. Fast. Komm, ich zeig dir die große Karte.", "Now I've got the keep. Almost. Come, I'll show you the big map."],
    r: RW(70, lore("Die große Karte", "The great map", "Ich habe sie an die Wand gehängt, damit alle sie sehen. Nicht, weil sie fertig ist. Sondern damit jeder, der hier ankommt, sieht: Man kann sich in der Feste zurechtfinden. Jemand hat es geschafft. Du.", "I hung it on the wall for everyone to see. Not because it's finished. But so everyone who arrives here sees: you can find your way in the keep. Someone did. You.")) });
  q({ id: "ed_geheim", g: "edda", st: 2, ev: "geheimnis", f: d => d.bio === "verlies", n: 3, req: () => visited("verlies"),
    t: ["Finde 3 Geheimnisse im Verlies.", "Find 3 secrets in the dungeon."],
    o: ["Das Verlies. Auf meiner Karte ist es fast leer. Das glaube ich nicht. Drei Geheimnisse – mindestens.", "The dungeon. On my map it's almost empty. I don't believe that. Three secrets – at least."],
    d: ["Ha! Leer, sagten sie.", "Ha! Empty, they said."], r: RW(55) });
  /* ---------- Quirin ---------- */
  q({ id: "qu_durst", g: "quirin", st: 0, ev: "area", f: d => d.nopot, n: 1,
    t: ["Schließe ein Gebiet ab, ohne einen Trank zu trinken.", "Clear an area without drinking a potion."],
    o: ["Ein Experiment! Ein ganzes Gebiet, kein Trank. Ich messe, wie grün du dabei wirst.", "An experiment! A whole area, no potion. I'll measure how green you turn."],
    d: ["Faszinierend! Du bist gar nicht grün geworden. Etwas rot. Aber das warst du vorher schon.", "Fascinating! You didn't turn green at all. A bit red. But you were before."],
    r: RW(35, lore("Quirins Tagebuch, Seite 1", "Quirin's journal, page 1", "Versuch 212: Pilzsud mit Rattenschwanz. Ergebnis: Barradin hat drei Stunden lang nur gesungen. Also wie immer. Versuch abgebrochen. Notiz: Kontrollgruppe fehlt.", "Trial 212: mushroom brew with rat tail. Result: Barradin sang for three hours straight. So, as usual. Trial aborted. Note: no control group.")) });
  q({ id: "qu_kunst", g: "quirin", st: 1, ev: "kill", f: k => k.skill, n: 15,
    t: ["Erledige 15 Gegner mit Fähigkeiten.", "Finish 15 enemies with skills."],
    o: ["Phiolen, Bomben, Wolken – Fähigkeiten! Fünfzehn Gegner. Für die Wissenschaft. Und für meinen Ruf.", "Vials, bombs, clouds – skills! Fifteen enemies. For science. And for my reputation."],
    d: ["Die Daten sind … explosiv. Danke!", "The data is… explosive. Thank you!"], r: RW(45) });
  q({ id: "qu_roben", g: "quirin", st: 2, ev: "kill", f: k => k.robe, n: 12, req: () => seenGrp("robe"),
    t: ["Erledige 12 Robenträger.", "Finish 12 robed cultists."],
    o: ["Die Roten Roben haben mir meine Rezepte gestohlen. Zwölf weniger, und ich schlafe wieder.", "The Red Robes stole my recipes. Twelve fewer, and I'll sleep again."],
    d: ["Ich hab ein Rezept zurück! Es war … ein Kuchenrezept. Auch gut.", "I got a recipe back! It was… for cake. Fine, too."], r: RW(55, lore("Das gestohlene Rezept", "The stolen recipe", "Ich war einmal Lehrling bei den Roben. Zwei Tage lang. Am dritten Tag habe ich gefragt, wofür die Tränke sind. Sie haben mich in den Keller gesperrt. Seitdem frage ich immer zuerst, und braue erst danach.", "I was an apprentice of the Robes once. For two days. On the third day I asked what the potions were for. They locked me in the cellar. Since then I always ask first and brew later.")) });
  /* ---------- Sigrun ---------- */
  q({ id: "si_untot", g: "sigrun", st: 1, ev: "kill", f: k => k.untot, n: 15, req: () => seenGrp("untot"),
    t: ["Erledige 15 Untote.", "Finish 15 undead."],
    o: ["Die Toten in der Feste tragen falsche Runen. Löse fünfzehn von ihnen. Sie werden es dir nicht danken. Ich schon.", "The dead in the keep bear false runes. Release fifteen of them. They won't thank you. I will."],
    d: ["Fünfzehn Fäden, durchtrennt. Die Steine sind zufrieden.", "Fifteen threads, cut. The stones are content."],
    r: RW(45, lore("Sigruns erste Rune", "Sigrun's first rune", "Die erste Rune, die ich gelesen habe, stand auf dem Grabstein meiner Großmutter. Sie hieß ‚Bleib‘. Ich bin geblieben, bis die Runen mich weggeschickt haben. Jetzt bin ich hier. Vielleicht hieß sie auch ‚Geh‘. Runen sind so.", "The first rune I read was on my grandmother's gravestone. It meant 'stay'. I stayed until the runes sent me away. Now I'm here. Perhaps it meant 'go'. Runes are like that.")) });
  q({ id: "si_elite", g: "sigrun", st: 2, ev: "kill", f: k => k.elite, n: 3, run: true,
    t: ["Erledige 3 Elite-Gegner in einem Lauf.", "Finish 3 elite enemies in one run."],
    o: ["Die Starken tragen Zeichen unter der Haut. Drei in einem Lauf – dann lese ich dir, was sie verbergen.", "The strong bear signs beneath their skin. Three in one run – then I'll read you what they hide."],
    d: ["Die Zeichen sagen: Du wirst stärker. Die Zeichen übertreiben selten.", "The signs say: you grow stronger. The signs rarely exaggerate."], r: RW(50) });
  q({ id: "si_fragment", g: "sigrun", st: 2, ev: "rune", n: 1, req: () => Object.keys(M().runes || {}).length < 3,
    t: ["Finde ein Runen-Fragment in einem Geheimraum.", "Find a rune fragment in a secret room."],
    o: ["Ein Fragment ruft. Leise, aber deutlich. Es liegt hinter einer Wand, die keine sein will.", "A fragment calls. Quietly, but clearly. It lies behind a wall that doesn't want to be one."],
    d: ["Es singt. Hörst du? Nein? Schade.", "It sings. Do you hear? No? Pity."], r: RW(60) });
  /* ---------- Wendel: Das Rudel ---------- */
  q({ id: "w_tiere", g: "wendel", st: 0, ch: ["rudel", 0], ev: "kill", f: k => k.tier, n: 12, req: () => seenGrp("tier"),
    t: ["Erlöse 12 wilde Tiere (Wölfe, Ratten, Fledermäuse, Krabben …).", "Put 12 wild beasts to rest (wolves, rats, bats, crabs…)."],
    o: ["Arme Viecher. Die Feste macht sie wild. Erlös zwölf – schnell und sauber. Rex schaut weg.", "Poor creatures. The keep drives them wild. Release twelve – quick and clean. Rex will look away."],
    d: ["Schnell und sauber. Danke. Die Tiere hätten's auch gesagt.", "Quick and clean. Thank you. The animals would have said so, too."],
    r: RW(35, lore("Wendels Hunde", "Wendel's dogs", "Ich hatte sieben Hunde. Als die Feste mich geholt hat, sind sie weggelaufen. Kluge Hunde. Manchmal höre ich nachts ein Heulen vom Wehrgang. Ich glaube, einer wartet noch.", "I had seven dogs. When the keep took me, they ran. Clever dogs. Sometimes at night I hear howling from the ramparts. I think one is still waiting.")) });
  q({ id: "w_kaefig", g: "wendel", st: 1, ch: ["rudel", 1], ev: "befreit", n: 1, req: () => (M().befreit || 0) >= 1,
    t: ["Befreie einen gefesselten Kundschafter.", "Free a shackled scout."],
    o: ["Wer Tiere kennt, kennt Käfige. Öffne einen. Für einen Menschen diesmal.", "Whoever knows animals knows cages. Open one. For a person this time."],
    d: ["Ein Käfig weniger auf der Welt. Gut.", "One cage fewer in the world. Good."],
    r: RW(40, lore("Der letzte Hund", "The last dog", "Rex hat mich gefunden, nicht umgekehrt. Er kam an meinen Käfig, hat geschnuppert, ist gegangen und mit Friedrich zurückgekommen. Friedrich sagt, er hat ihn hingeführt. Rex sagt etwas anderes. Ich glaube Rex.", "Rex found me, not the other way round. He came to my cage, sniffed, left, and came back with Friedrich. Friedrich says he led him there. Rex says otherwise. I believe Rex.")) });
  q({ id: "w_rudel", g: "wendel", st: 2, ch: ["rudel", 2], ev: "kill", f: k => k.tier, n: 15, run: true, req: () => seenGrp("tier"),
    t: ["Erlöse 15 wilde Tiere in einem Lauf.", "Put 15 wild beasts to rest in one run."],
    o: ["Das Rudel da drin hat einen Leitwolf, der nicht stirbt. Fünfzehn Tiere in einem Lauf – dann weiß er, wer jetzt führt.", "The pack in there has a leader that won't die. Fifteen beasts in one run – then it'll know who leads now."],
    d: ["Jetzt bist du der Leitwolf. Rex hat dir sein Kissen überlassen. Das tut er nie.", "Now you're the leader. Rex gave you his cushion. He never does that."],
    r: RW(70, lore("Rex' Hütte", "Rex's kennel", "Ich habe Rex eine Hütte gebaut. Er schläft nicht drin. Er schläft davor, mit der Nase zum Tor. Er wartet auf dich. Jedes Mal. Ich hab aufgehört, ihm zu sagen, dass du zurückkommst. Er weiß es besser als ich.", "I built Rex a kennel. He doesn't sleep in it. He sleeps in front of it, nose towards the gate. He waits for you. Every time. I've stopped telling him you'll come back. He knows better than I do.")) });
  /* ---------- Jori ---------- */
  q({ id: "j_klingen", g: "jori", st: 0, ev: "kill", f: k => k.cls === "klinge", n: 30,
    t: ["Erledige 30 Gegner mit Klingen.", "Finish 30 enemies with blades."],
    o: ["Klingen! Dreißig! Dann weiß ich, ob mein Schliff taugt. Und ob du's tust.", "Blades! Thirty! Then I'll know if my edge is any good. And whether you are."],
    d: ["Er hält! Mein Schliff hält! … Deiner auch.", "It holds! My edge holds! … Yours too."], r: RW(35) });
  q({ id: "j_schild", g: "jori", st: 1, ev: "bash", n: 10, req: () => foundCls("schild"),
    t: ["Erledige 10 Gegner mit Schildstößen.", "Finish 10 enemies with shield bashes."],
    o: ["Ein Schild ist auch eine Waffe! Nundro sagt nein. Beweis ihm das Gegenteil – zehn Schildstöße!", "A shield is a weapon too! Nundro says no. Prove him wrong – ten shield bashes!"],
    d: ["Ich hab's ihm gesagt! Er hat gegrunzt. Das heißt: Recht hast du.", "I told him! He grunted. That means: you're right."], r: RW(45) });
  q({ id: "j_mini", g: "jori", st: 2, ev: "kill", f: k => k.mini, n: 2, req: () => Object.keys(achZ().mini || {}).length >= 1,
    t: ["Erledige 2 Mini-Bosse.", "Finish 2 mini-bosses."],
    o: ["Die großen Biester haben die besten Waffen. Zwei! Ich will sehen, was die tragen. Für … Studien.", "The big brutes carry the best weapons. Two! I want to see what they carry. For… studies."],
    d: ["Zwei! Ich hab Zeichnungen gemacht. Schiefe.", "Two! I made drawings. Crooked ones."], r: RW(60) });
  /* ---------- Alwin ---------- */
  q({ id: "a_spuren", g: "alwin", st: 0, ev: "spur", n: 3,
    t: ["Lies 3 Spuren früherer Abenteurer.", "Read 3 traces of earlier adventurers."],
    o: ["Spuren. Notizen. Knochen mit Handschrift. Lies drei – ich schreibe ab.", "Traces. Notes. Bones with handwriting. Read three – I'll copy them out."],
    d: ["Herrlich traurig. Das kommt ins Kapitel ‚Die vor uns‘.", "Wonderfully sad. That goes in the chapter 'Those before us'."], r: RW(35) });
  q({ id: "a_seiten", g: "alwin", st: 1, ev: "seite", n: 2, req: () => Object.keys(M().tagebuch || {}).length <= 11,
    t: ["Finde 2 Seiten aus Miras Tagebuch.", "Find 2 pages of Mira's diary."],
    o: ["Miras Tagebuch. Jede Seite ist eine Stimme, die sonst keiner hört. Zwei, bitte.", "Mira's diary. Every page is a voice nobody else would hear. Two, please."],
    d: ["Ich lese sie heute Nacht. Mit Kerze. Und Taschentuch.", "I'll read them tonight. With a candle. And a handkerchief."], r: RW(45) });
  q({ id: "a_bosse", g: "alwin", st: 2, ev: "boss", n: 2,
    t: ["Besiege 2 Bosse oder Wächter.", "Defeat 2 bosses or wardens."],
    o: ["Kapitel neun braucht einen Höhepunkt. Zwei, genau genommen. Besiege zwei Bosse – ich schreibe mit.", "Chapter nine needs a climax. Two, strictly speaking. Defeat two bosses – I'll take notes."],
    d: ["Kapitel neun ist fertig! Es hat sieben Fußnoten. Alle über dich.", "Chapter nine is done! It has seven footnotes. All about you."],
    r: RW(60, lore("Alwins Vorwort", "Alwin's preface", "Ich bin den Bossen gefolgt, nicht den Helden. Helden sterben jung und reden zu viel. Bosse sterben selten und schweigen. Dann kamst du. Du stirbst ständig und schweigst trotzdem. Das ist neu. Ich habe ein neues Buch angefangen.", "I followed the bosses, not the heroes. Heroes die young and talk too much. Bosses rarely die and say nothing. Then you came. You die constantly and still say nothing. That's new. I've started a new book.")) });
  q({ id: "a_ende", g: "alwin", st: 3, ev: "ende", n: 1,
    t: ["Erreiche ein Ende.", "Reach an ending."],
    o: ["Jede Chronik braucht ein Ende. Gib mir eins. Ein neues, wenn's geht.", "Every chronicle needs an ending. Give me one. A new one, if possible."],
    d: ["Und so endet es … vorerst. Die besten Bücher haben Fortsetzungen.", "And so it ends… for now. The best books have sequels."], r: RW(80) });
  /* ---------- Lotte ---------- */
  q({ id: "l_ereignis", g: "lotte", st: 0, ev: "ereignis", n: 3,
    t: ["Schließe 3 Raum-Ereignisse ab (Schrein, Brunnen, Wette …).", "Complete 3 room events (shrine, well, bet…)."],
    o: ["Geschäft ist Geschäft: Drei Raum-Ereignisse – Schrein, Brunnen, was auch immer – und ich zahle dich aus. In Splittern. Echten.", "Business is business: three room events – shrine, well, whatever – and I'll pay you. In shards. Real ones."],
    d: ["Da. Echte Splitter. Ich hab sie selbst gezählt. Zweimal.", "There. Real shards. I counted them myself. Twice."], r: RW(40) });
  q({ id: "l_dieb", g: "lotte", st: 1, ev: "dieb", n: 1, req: () => (achZ().dieb || 0) >= 1 || seenGrp("goblin"),
    t: ["Erwische einen Goldgoblin.", "Catch a gold goblin."],
    o: ["Ein Goldgoblin hat mir einen Beutel geklaut. Nicht irgendeinen. Meinen. Erwisch einen – irgendeinen. Die stecken alle unter einer Decke.", "A gold goblin stole a purse from me. Not just any purse. Mine. Catch one – any of them. They're all in it together."],
    d: ["Ha! Rache ist Ware, und Ware ist süß.", "Ha! Revenge is merchandise, and merchandise is sweet."], r: RW(50, lore("Lottes Karren", "Lotte's cart", "Den Karren hat mein Vater gebaut. Er hat gesagt: Ein Karren muss so gebaut sein, dass man mit ihm flüchten kann. Ich hab damit nie flüchten müssen. Nur einmal in die Feste fahren. Das war eher das Gegenteil.", "My father built the cart. He said: a cart must be built so you can flee with it. I never had to flee. Only drive into the keep once. That was rather the opposite.")) });
  q({ id: "l_schatz", g: "lotte", st: 2, ev: "gold", n: 2000,
    t: ["Sammle 2.000 Gold.", "Collect 2,000 gold."],
    o: ["Zweitausend Gold. Nicht für mich. Na gut, für mich. Aber du bekommst Prozente.", "Two thousand gold. Not for me. Fine, for me. But you'll get a percentage."],
    d: ["Zweitausend! Ich bin gerührt. Und reich. Vor allem reich.", "Two thousand! I'm moved. And rich. Mostly rich."], r: RW(70) });
  /* ---------- Mira ---------- */
  q({ id: "m_spinnen", g: "mira", st: 3, ev: "kill", f: k => k.spinne, n: 15, req: () => seenGrp("spinne"),
    t: ["Erledige 15 Spinnenwesen.", "Finish 15 spider creatures."],
    o: ["Fäden. Immer Fäden. Zerschneide fünfzehn von denen, die sie spinnen. Für Grete.", "Threads. Always threads. Cut down fifteen of those who spin them. For Grete."],
    d: ["Für Grete. Sie hätte gelacht und gesagt: Erst fünfzehn?", "For Grete. She'd have laughed and said: only fifteen?"], r: RW(70, lore("Grete", "Grete", "Grete ist als Erste in den Schlund gestiegen. Sie hat gesagt: Wenn ich nicht zurückkomme, hab ich wenigstens nicht gewartet. Sie ist nicht zurückgekommen. Ich warte trotzdem manchmal. Nur kurz.", "Grete was the first to climb into the maw. She said: if I don't come back, at least I didn't wait. She didn't come back. I still wait sometimes. Only briefly.")) });
  q({ id: "m_pakt", g: "mira", st: 3, ev: "ende", f: d => d.pacts >= 1, n: 1,
    t: ["Erreiche ein Ende mit mindestens einem Pakt.", "Reach an ending with at least one pact."],
    o: ["Für Holm. Er hat immer gesagt, man muss etwas einsetzen, damit es zählt. Ein Ende – mit mindestens einem Pakt.", "For Holm. He always said you have to stake something for it to count. An ending – with at least one pact."],
    d: ["Holm hätte gebetet. Ich zünde eine Kerze an. Für dich.", "Holm would have prayed. I'll light a candle. For you."], r: RW(90, lore("Holm und Tavik", "Holm and Tavik", "Holm hat jeden Abend gebetet, auch als keiner mehr zuhörte. Tavik hat jeden Abend gelacht, auch als es nichts zu lachen gab. Ich weiß nicht, wer von beiden recht hatte. Ich glaube, man braucht beides.", "Holm prayed every evening, even when no one was listening any more. Tavik laughed every evening, even when there was nothing to laugh about. I don't know which of them was right. I think you need both.")) });
  const QI = {}; for (const x of Q) QI[x.id] = x;
  Z.AUFTR = Q;

  /* ======================= KETTEN ======================= */
  const CHAINS = {
    jagd: { g: "friedrich", n: ["Die große Jagd", "The Great Hunt"], ach: "q_jagd", titel: ["Fährtenleser", "the Tracker"], cape: "jaeger" },
    garten: { g: "echo", n: ["Echos Garten", "Echo's Garden"], ach: "q_garten", titel: ["Freund der Wurzeln", "Friend of Roots"], cape: "garten" },
    ballade: { g: "barradin", n: ["Die Ballade vom Zerstörer", "The Ballad of the Destroyer"], ach: "q_ballade", titel: ["Held der Ballade", "Hero of the Ballad"], cape: "ballade" },
    amboss: { g: "nundro", n: ["Glut und Amboss", "Ember and Anvil"], ach: "q_amboss", titel: ["Ambossfreund", "Anvil's Friend"], cape: "amboss" },
    wege: { g: "edda", n: ["Wege der Feste", "Paths of the Keep"], ach: "q_wege", titel: ["Wegekundiger", "the Wayfinder"], cape: "wege" },
    rudel: { g: "wendel", n: ["Das Rudel", "The Pack"], ach: "q_rudel", titel: ["Rudelführer", "Pack Leader"], cape: "rudel" }
  };
  for (const k in CHAINS) CHAINS[k].len = Q.filter(x => x.ch && x.ch[0] === k).length;
  Z.AUFTR_CHAINS = CHAINS;
  /* Umhänge der Ketten (kein Blau) */
  if (Z.CAPES) Object.assign(Z.CAPES, {
    jaeger: { n: ["Waldläufer", "Ranger"], c: ["#4a5a2a", "#1e2410"] }, garten: { n: ["Echos Garten", "Echo's Garden"], c: ["#7a9a3a", "#c8902a"] },
    ballade: { n: ["Ballade", "Ballad"], c: ["#8a3a8a", "#e5b454"] }, amboss: { n: ["Amboss", "Anvil"], c: ["#4a4038", "#c86a2a"] },
    wege: { n: ["Wegekundig", "Wayfinder"], c: ["#c8a060", "#6a3a1a"] }, rudel: { n: ["Rudel", "Pack"], c: ["#7a5a3a", "#2e2014"] },
    lagerfeuer: { n: ["Lagerfeuer", "Campfire"], c: ["#e07a2a", "#5a1a0a"] }
  });

  /* ======================= SPEICHER ======================= */
  let stRef = null;
  function ST() {
    const m = M(); let s = m.auftr;
    if (s && s === stRef) return s;
    const obj = v => v && typeof v === "object" && !Array.isArray(v);
    if (!obj(s)) s = m.auftr = {};
    if (!Array.isArray(s.akt)) s.akt = [];
    s.akt = s.akt.filter((a, i, arr) => obj(a) && QI[a.id] && arr.findIndex(b => b && b.id === a.id) === i).slice(0, MAX_AKT);
    for (const a of s.akt) { if (!Number.isFinite(a.p)) a.p = 0; a.ok = !!a.ok; }
    for (const k of ["done", "dec", "decG", "lore", "seen"]) if (!obj(s[k])) s[k] = {};
    if (!Number.isFinite(s.glut)) s.glut = 0;
    if (!Number.isFinite(s.n)) s.n = Object.keys(s.done).length;
    s.v = 1; stRef = s; return s;
  }
  const save = () => { try { Z.saveMeta && Z.saveMeta(); } catch (_) {} };
  const visits = () => ((M().lager && M().lager.visits) | 0);
  const chainStage = k => Q.filter(x => x.ch && x.ch[0] === k && ST().done[x.id]).length;
  const chainDone = k => !!CHAINS[k] && chainStage(k) >= CHAINS[k].len;

  /* ======================= ANGEBOTE ======================= */
  function present(g) {
    const G = GIVER[g]; if (!G) return false;
    if (G.npc) return true;
    const lr = M().lager && M().lager.res && M().lager.res[G.res];
    return !!(Z.lager && Z.lager.has && Z.lager.has(G.res) && lr && lr.met); /* erst nach der Vorstellung (lager.js talk) */
  }
  function eligible(x) {
    const s = ST();
    if (s.done[x.id] || s.akt.some(a => a.id === x.id)) return false;
    if ((x.st || 0) > tier()) return false;
    if (x.ch && x.ch[1] > 0) { const prev = Q.find(y => y.ch && y.ch[0] === x.ch[0] && y.ch[1] === x.ch[1] - 1); if (prev && !s.done[prev.id]) return false; }
    try { if (x.req && !x.req()) return false; } catch (_) { return false; }
    return true;
  }
  /* Ein Angebot je Bewohner: Ketten zuerst, dann nach Stufe; zuletzt Abgelehntes (bei diesem Besuch gar nicht) */
  function offerOf(g) {
    if ((M().runs || 0) < 1 && !Z.auftrSofort) return null; /* der allererste Lagerbesuch gehört den Tipps – Aufträge ab dem ersten Lauf */
    const s = ST(), v = visits();
    if (s.decG[g] === v) return null; /* abgelehnt: bis zum nächsten Lagerbesuch Ruhe – dann ein anderer Auftrag zuerst */
    const list = Q.filter(x => x.g === g && eligible(x));
    if (!list.length) return null;
    const dec = x => (s.dec[x.id] == null ? -1 : s.dec[x.id]);
    const fresh = list.filter(x => dec(x) !== v);
    const pool = fresh.length ? fresh : list; /* nur Abgelehntes übrig (nach „Doch noch einmal ansehen“): wieder anbieten */
    pool.sort((a, b) => dec(a) - dec(b) || (b.ch ? 1 : 0) - (a.ch ? 1 : 0) || (a.st || 0) - (b.st || 0) || Q.indexOf(a) - Q.indexOf(b));
    return pool[0];
  }
  const aktOf = g => ST().akt.find(a => QI[a.id].g === g) || null;
  /* Neuigkeit: Belohnung wartet, oder ein frisches Angebot und noch kein Auftrag von diesem Bewohner.
     newsC: Zwischenspeicher für das Zeichnen je Bild (alle 0,5 s oder nach Änderungen neu) */
  let newsC = null, newsAt = 0;
  function newsCached(g) {
    const now = performance.now();
    if (!newsC || now - newsAt > 500) { newsC = {}; newsAt = now; for (const k in GIVER) newsC[k] = news(k); }
    return newsC[g];
  }
  const newsReset = () => { newsC = null; };
  function news(g) {
    if (!present(g)) return null;
    const a = aktOf(g);
    if (a && a.ok) return "lohn";
    if (!a && offerOf(g)) return "neu";
    return null;
  }

  /* ======================= ZÄHLEN ======================= */
  let runTag = 0, runRef = null;
  function curRun() { if (Z.run !== runRef) { runRef = Z.run; if (Z.run) runTag++; } return Z.run ? runTag : 0; }
  function prog(a) { const x = QI[a.id]; if (x.run && a.run !== curRun() && !a.ok) return 0; return Math.min(x.n, a.p | 0); }
  function ev(key, amount, data) {
    const s = ST(); if (!s.akt.length) return;
    amount = amount == null ? 1 : amount;
    let changed = false;
    for (const a of s.akt) {
      if (a.ok) continue;
      const x = QI[a.id]; if (x.ev !== key) continue;
      try { if (x.f && !x.f(data || {})) continue; } catch (_) { continue; }
      if (x.run) { const r = curRun(); if (!r) continue; if (a.run !== r) { a.run = r; a.p = 0; } }
      const before = a.p;
      a.p = x.max ? Math.max(a.p, amount) : a.p + amount;
      if (a.p !== before) changed = true;
      if (a.p >= x.n) { a.p = x.n; a.ok = true; finished(x); }
    }
    if (changed) { hudDirty = true; saveSoon(); }
  }
  let saveT = 0;
  const saveSoon = () => { saveT = saveT || 2.5; };
  function finished(x) {
    hudDirty = true; newsReset(); save();
    const G = GIVER[x.g];
    try { if (Z.music && Z.music.stinger) Z.music.stinger("erfolg", { kat: "sammeln", gross: !!x.ch, stufe: x.ch ? "gold" : "silber" }); else A.play("bell", { vol: 0.5 }); } catch (_) { try { A.play("bell", { vol: 0.5 }); } catch (__) {} }
    const u = ui(), html = "📜 <b>" + L(["Auftrag erfüllt: ", "Task complete: "]) + esc(L(x.t)) + "</b><br><small>" + esc(L(["Belohnung bei " + G.n + " im Lager abholen.", "Collect your reward from " + G.n + " at camp."])) + "</small>";
    if (u.notify) { try { u.notify(html, { prio: 1, art: "sieg", dauer: 4200 }); return; } catch (_) {} }
    if (Z.toast) Z.toast(html, 4200);
  }
  Z.auftrEv = ev; /* Schnittstelle für andere Module: Z.auftrEv("rennen") usw. */

  /* Kill-Merkmale */
  const RANGED_SRC = { ranged: 1 };
  function killTags(e, o) {
    const id = e.id || (e.def && e.def.id) || "", d = e.def || (Z.ENEMIES && Z.ENEMIES[id]) || {};
    const k = { id, elite: !!e.elite, skill: o.src === "skill", umg: o.src === "trap" || o.src === "fall" || o.src === "wall", bio: Z.level && Z.level.id };
    for (const g in GRP) k[g] = !!GRP[g](id, d);
    const W = o.it && Z.WEAPONS && Z.WEAPONS[o.it.id];
    k.cls = W && Z.upClass ? Z.upClass(W) : null;
    k.fern = !!(RANGED_SRC[o.src] || (k.cls === "schuss" && o.src !== "skill"));
    return k;
  }
  /* Zähler-Differenzen (laufen pro Bild; ein neuer Lauf setzt Z.stats zurück → Basis neu) */
  const base = {};
  function diff(key, v) { v = +v || 0; const b = base[key]; base[key] = v; if (b == null || v < b) return 0; return v - b; }
  /* W27 Koop: Spieler 2 ist Z.koop.p2 (koop.js) – Schaden und Leben beider zählen; Kills zählen ohnehin für alle */
  const players = () => { if (Array.isArray(Z.players) && Z.players.length) return Z.players.filter(Boolean); const out = Z.player ? [Z.player] : []; const p2 = Z.koop && Z.koop.p2; if (p2 && p2 !== Z.player) out.push(p2); return out; };
  const dmgSum = () => players().reduce((s, P) => s + (P.dmgTaken || 0), 0);
  let area = null, fight = null;
  function track(dt) {
    const run = Z.run, lv = Z.level; curRun();
    const s = S(), X = achZ(), R = Z.achRun ? Z.achRun() : null, m = M();
    const d = (k, v, evk, data) => { const n = diff(k, v); if (n > 0) ev(evk, n, data); };
    if (run && lv && !lv.hub) {
      d("parry", s.parries, "parry"); d("dodge", s.dodges, "dodge"); d("gold", s.gold, "gold"); d("befreit", s.befreit, "befreit");
      d("geh", m.geheimnisse, "geheimnis", { bio: lv.id });
      if (R) { d("dive", R.dive, "dive"); d("surp", R.surp, "surp"); d("bash", R.bash, "bash"); }
      const st = s.bestStreak || 0; if (st > 0) ev("serie", st);
      const P = Z.player; if (P && P.slots) { let mx = 0; for (const k in P.slots) { const it = P.slots[k]; if (it && it.plus > mx) mx = it.plus; } if (mx > 0) ev("plus", mx); }
    } else { for (const k of ["parry", "dodge", "gold", "befreit", "dive", "surp", "bash"]) base[k] = null; base.geh = m.geheimnisse || 0; }
    d("wucht", X.wu, "wucht"); d("morsch", X.mo, "morsch"); d("rennen", X.rennen, "rennen"); d("raetsel", X.raetsel, "raetsel"); d("dieb", X.dieb, "dieb");
    d("spur", m.spuren, "spur"); d("ereignis", m.events, "ereignis");
    d("seite", Object.keys(m.tagebuch || {}).length, "seite"); d("rune", Object.keys(m.runes || {}).length, "rune");
    const ne = Object.keys(m.endings || {}).length, nw = m.wins || 0;
    if (diff("ende", ne + nw * 1000) > 0) ev("ende", 1, { pacts: run && run.pacts ? run.pacts.length : 0 });
    /* Gebiet: Zeit, Schaden, Tränke */
    if (run && lv && !lv.hub && !lv.passage && Z.BIOMES && Z.BIOMES[lv.id]) {
      if (!area || area.lv !== lv) area = { lv, id: lv.id, dmg: 0, dm: dmgSum(), pot: s.potions || 0 };
      const dm = dmgSum(); if (dm > area.dm) area.dmg += dm - area.dm; area.dm = dm;
    } else if (!lv || lv.hub) area = null;
    /* Bosskampf */
    const b = Z.boss;
    if (run && b && (!fight || fight.e !== b)) fight = { e: b, id: b.id || (b.def && b.def.id), warden: !!(b.warden || (b.def && b.def.warden)), dm: dmgSum(), dmg: 0, pot: s.potions || 0, weapon: false, done: false };
    if (fight && !fight.done) {
      const dm = dmgSum(); if (dm > fight.dm) fight.dmg += dm - fight.dm; fight.dm = dm;
      if (Z.bossDefeated && Z.boss === fight.e) { fight.done = true; ev("boss", 1, { id: fight.id, warden: fight.warden, nohit: fight.dmg <= 0, onlySkills: !fight.weapon, nopot: (S().potions || 0) <= fight.pot }); }
    }
    if (fight && !b) fight = null;
  }
  function areaLeave(prev, id, opts) {
    if (!prev || id !== "passage" || !opts || opts.from !== prev.id || !area || area.lv !== prev) return;
    if (!Z.BIOMES || !Z.BIOMES[prev.id] || prev.hub || prev.arena || prev.passage) return;
    const P = Z.player; if (!P || P.dead) return;
    let allRooms = false, secretsAll = false;
    try { const R = Z.achRun && Z.achRun(), rec = R && R.ar && R.ar[prev.id]; const need = Object.keys(prev.cells || {}).filter(k => prev.cells[k].kind !== "secret"); allRooms = !!(rec && need.length && need.every(k => rec.cells[k])); } catch (_) {}
    try { const E = Z.erkundung && Z.erkundung(); secretsAll = !!(E && E.lv === prev && E.total > 0 && E.found.size >= E.total); } catch (_) {}
    ev("area", 1, { id: prev.id, nohit: area.dmg <= 0, nopot: (S().potions || 0) <= area.pot, voll: players().every(p => p.hp >= p.hpMax - 0.5), allRooms, secretsAll });
  }

  /* ======================= ANNEHMEN, ABLEHNEN, TAUSCHEN, ABHOLEN ======================= */
  function accept(id, swapId) {
    const s = ST(), x = QI[id]; if (!x || !eligible(x)) return false;
    if (swapId) { const i = s.akt.findIndex(a => a.id === swapId && !a.ok); if (i < 0) return false; s.dec[swapId] = visits(); s.akt.splice(i, 1); }
    if (s.akt.length >= MAX_AKT || aktOf(x.g)) return false;
    delete s.decG[x.g];
    s.akt.push({ id, p: 0, ok: false, run: 0, t0: Date.now() });
    delete s.dec[id]; hudDirty = true; newsReset(); save(); return true;
  }
  function decline(id) { const s = ST(), x = QI[id]; s.dec[id] = visits(); if (x) s.decG[x.g] = visits(); hudDirty = true; newsReset(); save(); }
  function abandon(id) { const s = ST(), i = s.akt.findIndex(a => a.id === id && !a.ok); if (i < 0) return false; s.akt.splice(i, 1); s.dec[id] = visits(); hudDirty = true; newsReset(); save(); return true; }
  function rewardLines(x) {
    const r = x.r || {}, out = [];
    if (r.sh) out.push(r.sh + " ◆ " + L(["Seelensplitter", "soul shards"]));
    if (r.glut) out.push(r.glut + " ✦ " + L(["Glut zu Beginn des nächsten Laufs", "embers at the start of your next run"]));
    if (r.lore) out.push("📖 " + L(["Geschichte: ", "Story: "]) + L(["„", "“"]) + L(r.lore[0]) + L(["“", "”"]));
    if (x.ch) {
      const C = CHAINS[x.ch[0]];
      if (x.ch[1] === C.len - 1) { out.push("🏅 " + L(["Titel: ", "Title: "]) + L(["„", "“"]) + L(C.titel) + L(["“", "”"])); out.push("🧥 " + L(["Umhang: ", "Cape: "]) + L(Z.CAPES[C.cape].n)); out.push("🏕 " + L(["Eine bleibende Spur im Lager", "A lasting mark on the camp"])); }
      else out.push("🏕 " + L(["Das Lager wächst ein Stück (Ruhm)", "The camp grows a little (renown)"]));
    }
    return out;
  }
  function collect(id) {
    const s = ST(), i = s.akt.findIndex(a => a.id === id && a.ok); if (i < 0) return null;
    const x = QI[id], r = x.r || {}, m = M();
    s.akt.splice(i, 1); s.done[id] = Date.now(); s.n = Object.keys(s.done).length;
    if (r.sh) m.shards = (m.shards || 0) + r.sh;
    if (r.glut) s.glut = (s.glut || 0) + r.glut;
    if (r.lore) s.lore[id] = 1;
    if (x.ch) {
      const C = CHAINS[x.ch[0]], lm = m.lager;
      if (lm && lm.up && typeof lm.up === "object") lm.up["auftrag." + x.ch[0]] = Math.min(3, chainStage(x.ch[0])); /* Ruhm für die Lagerstufe (lager.js zählt m.up, höchstens 3 je Schlüssel) */
      if (chainDone(x.ch[0])) { m.capes = m.capes || {}; m.capes[C.cape] = 1; s.seen["spur." + x.ch[0]] = 0; }
    }
    hudDirty = true; newsReset(); save();
    try { if (Z.achTest && Z.achTest.check) Z.achTest.check(); } catch (_) {}
    return x;
  }

  /* ======================= ERFOLGE ======================= */
  const ACHS = [];
  for (const k in CHAINS) { const C = CHAINS[k];
    ACHS.push({ id: C.ach, c: "sammeln", n: [C.n[0], C.n[1]], d: ["Die Auftragskette von " + GIVER[C.g].n + " abschließen.", "Complete " + GIVER[C.g].n + "'s chain of tasks."], ok: () => chainDone(k), r: { cape: C.cape, titel: C.titel }, p: () => [chainStage(k), C.len] }); }
  ACHS.push({ id: "q_10", c: "sammeln", n: ["Helfende Hand", "Helping Hand"], d: ["10 Aufträge im Lager erledigen.", "Complete 10 camp tasks."], ok: () => Object.keys(ST().done).length >= 10, r: { titel: ["Lagerliebling", "Camp Favourite"] }, p: () => [Object.keys(ST().done).length, 10] });
  ACHS.push({ id: "q_25", c: "sammeln", n: ["Rechte Hand", "Right Hand"], d: ["25 Aufträge im Lager erledigen.", "Complete 25 camp tasks."], ok: () => Object.keys(ST().done).length >= 25, r: { cape: "lagerfeuer" }, p: () => [Object.keys(ST().done).length, 25] });
  ACHS.push({ id: "q_alle", c: "sammeln", n: ["Herz des Lagers", "Heart of the Camp"], d: ["Jeden Auftrag aller Bewohner erledigen.", "Complete every task of every resident."], ok: () => Q.every(x => ST().done[x.id]), r: { titel: ["Herz des Lagers", "Heart of the Camp"] }, p: () => [Q.filter(x => ST().done[x.id]).length, Q.length] });
  for (const a of ACHS) { a.kat = "sammeln"; a.selten = a.id === "q_alle"; a.siegel = { motiv: a.id === "q_alle" ? "herz" : a.id === "q_jagd" ? "pfeil" : a.id === "q_garten" ? "stern" : a.id === "q_ballade" ? "glocke" : a.id === "q_amboss" ? "flamme" : a.id === "q_wege" ? "karte" : a.id === "q_rudel" ? "pfote" : "truhe", stufe: a.id === "q_alle" ? "blut" : /^q_\d/.test(a.id) ? "silber" : "gold", band: true }; }
  function addAch() { if (!Z.ACH) return; for (const a of ACHS) if (!Z.ACH.some(x => x.id === a.id)) Z.ACH.push(a); }
  addAch();

  /* ======================= FENSTER BEIM BEWOHNER ======================= */
  let curG = null;
  function portraitHTML(g) { return '<canvas class="lg-bild au-bild" width="120" height="140" data-aug="' + g + '"></canvas>'; }
  function drawPortrait(g) {
    const cv = document.querySelector('#modal canvas[data-aug="' + g + '"]'); if (!cv) return;
    const G = GIVER[g];
    try {
      if (G.res && Z.lager && Z.lager.portrait && G.res !== "lied") { Z.lager.portrait(cv, G.res); return; }
      const c = cv.getContext("2d"), W = cv.width, H = cv.height;
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#3a2a22"); gr.addColorStop(1, "#1a1210"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = "lighter"; const rg = c.createRadialGradient(W / 2, H * 0.62, 4, W / 2, H * 0.62, W * 0.7); rg.addColorStop(0, "rgba(255,150,70,.35)"); rg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = rg; c.fillRect(0, 0, W, H); c.restore();
      c.save(); c.scale(W / 30, W / 30); if (Z.drawNPC) Z.drawNPC(c, G.npc || "B", 15, H / (W / 30) - 3, performance.now() / 1000, 1); c.restore();
      c.strokeStyle = "#8a6a2a"; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, H - 3);
    } catch (err) { console.error(err); }
  }
  const bar = (p, n) => '<div class="lg-fort au-fort"><i style="width:' + Math.round(Math.min(1, p / Math.max(1, n)) * 100) + '%"></i></div>';
  const fmtN = n => (Z.U && Z.U.fmt ? Z.U.fmt(n) : String(n));
  function taskHTML(x, a) {
    const p = a ? prog(a) : 0;
    const chainTag = x.ch ? '<span class="au-kette">' + esc(L(CHAINS[x.ch[0]].n)) + " · " + (x.ch[1] + 1) + "/" + CHAINS[x.ch[0]].len + "</span>" : "";
    return '<div class="au-auftrag' + (a && a.ok ? " fertig" : "") + '"><b>' + esc(L(x.t)) + "</b>" + chainTag + (x.run ? '<small class="au-lauf">' + L(["in einem Lauf", "in one run"]) + "</small>" : "") +
      (a ? bar(p, x.n) + '<small class="au-zahl">' + fmtN(p) + " / " + fmtN(x.n) + (a.ok ? " ✓" : "") + "</small>" : "") + "</div>";
  }
  function rewardHTML(x) { return '<ul class="au-lohn">' + rewardLines(x).map(t => "<li>" + esc(t) + "</li>").join("") + "</ul>"; }
  function openGiver(g, focus) {
    const G = GIVER[g]; if (!G) return;
    curG = g; const s = ST(), a = aktOf(g), x = a ? QI[a.id] : null, off = a ? null : offerOf(g);
    const quote = a && a.ok ? L(x.d) : a ? L(Z.R.pick(G.hi)) : off ? L(off.o) : L(Z.R.pick(G.none));
    let h = '<div class="lg-kopf">' + portraitHTML(g) + '<div class="lg-kopftxt"><h2>' + esc(G.n) + " <small>" + esc(L(G.r)) + " · " + L(["Aufträge", "Tasks"]) + '</small></h2><p class="lg-zitat">' + L(["„", "“"]) + esc(quote) + L(["“", "”"]) + '</p></div><span class="bank">' + fmtN(M().shards || 0) + " ◆</span></div>";
    if (a && a.ok) {
      h += "<h3>" + L(["Erledigt!", "Done!"]) + "</h3>" + taskHTML(x, a) + rewardHTML(x) + '<div class="knoepfe au-wahl"><button data-act="aufHol" data-arg="' + x.id + '" autofocus>🎁 ' + L(["Belohnung abholen", "Collect reward"]) + "</button></div>";
    } else if (a) {
      h += "<h3>" + L(["Dein Auftrag", "Your task"]) + "</h3>" + taskHTML(x, a) + rewardHTML(x) + '<div class="knoepfe au-wahl"><button data-act="aufWeg" data-arg="' + x.id + '">' + L(["Auftrag aufgeben", "Abandon task"]) + "</button></div>";
    } else if (off) {
      const full = s.akt.length >= MAX_AKT;
      h += "<h3>" + L(["Angebot", "Offer"]) + '</h3>' + taskHTML(off, null) + '<p class="au-klein">' + L(["Belohnung:", "Reward:"]) + "</p>" + rewardHTML(off);
      h += '<div class="knoepfe au-wahl">';
      if (!full) h += '<button data-act="aufAn" data-arg="' + off.id + '" autofocus>✔ ' + L(["Annehmen", "Accept"]) + "</button>";
      else {
        h += '<p class="au-klein au-voll">' + L(["Du hast schon " + MAX_AKT + " Aufträge. Tauschen?", "You already have " + MAX_AKT + " tasks. Swap?"]) + "</p>";
        let first = true;
        for (const b of s.akt) if (!b.ok) { h += '<button data-act="aufTausch" data-arg="' + off.id + "|" + b.id + '"' + (first ? " autofocus" : "") + ">⇄ " + L(["statt: ", "instead of: "]) + esc(L(QI[b.id].t)) + " <small>(" + esc(GIVER[QI[b.id].g].n) + ")</small></button>"; first = false; }
        if (first) h += '<p class="au-klein">' + L(["Hol erst deine Belohnungen ab.", "Collect your rewards first."]) + "</p>";
      }
      h += '<button data-act="aufAb" data-arg="' + off.id + '">✖ ' + L(["Ablehnen", "Decline"]) + "</button></div>";
    } else {
      const all = Q.filter(y => y.g === g), d = all.filter(y => s.done[y.id]).length;
      if (s.decG[g] === visits() && Q.some(y => y.g === g && eligible(y))) h += '<p class="hinweis">' + L(["Abgelehnt. Beim nächsten Lagerbesuch hat " + G.n + " etwas anderes für dich.", "Declined. On your next camp visit " + G.n + " will have something else for you."]) + '</p><div class="knoepfe au-wahl"><button data-act="aufDoch" data-arg="' + g + '">' + L(["Doch noch einmal ansehen", "Take another look"]) + "</button></div>";
      else h += '<p class="hinweis">' + (d >= all.length ? L(["Alle Aufträge erledigt. " + G.n + " ist zufrieden – auf seine Art.", "All tasks done. " + G.n + " is content – in their own way."]) : L(["Gerade kein Auftrag. Wer weiter in die Feste vordringt, bekommt neue.", "No task right now. Delve deeper into the keep for new ones."])) + "</p>";
    }
    /* Erinnerungen: freigeschaltete Geschichten erneut lesen */
    const lores = Q.filter(y => y.g === g && y.r && y.r.lore && s.lore[y.id]);
    if (lores.length) h += "<h3>" + L(["Geschichten am Feuer", "Fireside stories"]) + '</h3><div class="au-lore">' + lores.map(y => '<button data-act="aufLore" data-arg="' + y.id + '">📖 ' + esc(L(y.r.lore[0])) + "</button>").join("") + "</div>";
    const doneN = Q.filter(y => y.g === g && s.done[y.id]).length, allN = Q.filter(y => y.g === g).length;
    h += '<p class="au-klein au-stand">' + L(["Erledigt bei " + G.n + ": ", "Done for " + G.n + ": "]) + doneN + " / " + allN + " · " + L(["Aktiv: ", "Active: "]) + s.akt.length + " / " + MAX_AKT + "</p>";
    const back = G.npc === "A" ? ["aufZu", L(["Zur Schmiede", "To the forge"])] : G.npc === "B" ? ["aufZu", L(["Zum Fundbuch", "To the ledger"])] : G.res && Z.lager && Z.lager.has(G.res) ? ["aufZu", G.res === "lied" ? L(["Zur Bühne", "To the stage"]) : L(["Zum Stand", "To the stall"])] : null;
    h += '<div class="knoepfe">' + (back ? '<button data-act="' + back[0] + '" data-arg="' + g + '">' + esc(back[1]) + "</button>" : "") + '<button data-act="close">' + L(["Zurück", "Back"]) + "</button></div>";
    ui().open(h, { cls: "lager auftr" });
    drawPortrait(g);
    if (!ui().touchOn) setTimeout(() => { const b = (focus && document.querySelector('#modal [data-act="' + focus + '"]')) || document.querySelector("#modal [autofocus]") || document.querySelector('#modal .au-wahl button, #modal [data-act="close"]'); if (b) b.focus({ preventScroll: true }); }, 40);
  }
  const loreTxt = t => esc(t).replace(/ \/ /g, "<br>"); /* Barradins Strophen: Verszeilen */
  function openLore(id, back) {
    const x = QI[id]; if (!x || !x.r || !x.r.lore) return;
    ui().open('<div class="tagebuch"><p class="tb-kopf">' + esc(GIVER[x.g].n) + "</p><h2>" + esc(L(x.r.lore[0])) + '</h2><p class="tb-text">' + loreTxt(L(x.r.lore[1])) + '</p><div class="knoepfe"><button data-act="aufLoreZu" data-arg="' + (back || "") + '" autofocus>' + L(["Weiter", "Continue"]) + "</button></div></div>", { cls: "schmal" });
  }
  function ceremony(x) {
    const G = GIVER[x.g], fin = x.ch && chainDone(x.ch[0]);
    try { if (Z.music && Z.music.stinger) Z.music.stinger("erfolg", { kat: "sammeln", gross: !!fin, stufe: fin ? "blut" : "gold" }); } catch (_) {}
    try { A.play("coin", { vol: 0.6 }); } catch (_) {}
    let h = '<div class="au-feier"><p class="tb-kopf">' + esc(G.n) + "</p><h2>" + L(["Belohnung", "Reward"]) + "</h2>" + '<p class="lg-zitat">' + L(["„", "“"]) + esc(L(x.d)) + L(["“", "”"]) + '</p>' + rewardHTML(x);
    if (fin) h += '<p class="au-kettenende">🏅 ' + esc(L(CHAINS[x.ch[0]].n)) + " – " + L(["abgeschlossen!", "complete!"]) + "</p>";
    if (x.r && x.r.lore) h += '<div class="tagebuch au-lore-txt"><h3>' + esc(L(x.r.lore[0])) + '</h3><p class="tb-text">' + loreTxt(L(x.r.lore[1])) + "</p></div>";
    h += '<div class="knoepfe"><button data-act="aufFeierZu" data-arg="' + x.g + '" autofocus>' + L(["Danke!", "Thanks!"]) + "</button></div></div>";
    ui().open(h, { cls: "lager auftr" });
    if (Z.lagerwelt && Z.lagerwelt.feier) { try { Z.lagerwelt.feier(x.g); } catch (_) {} }
  }
  function sayAt(g, txt, ms) {
    const G = GIVER[g], lv = Z.level; if (!lv || !ui().say) return;
    const pos = giverPos(g); if (pos) ui().say(pos.x, pos.y - 34, G.n, txt, ms || 3200);
  }
  function giverPos(g) {
    const G = GIVER[g], lv = Z.level; if (!lv || !lv.hub) return null;
    if (G.res && G.res !== "lied" && Z.lager && Z.lager._camp) { const c = Z.lager._camp(); const o = c && c.res && c.res.find(r => r.id === G.res); if (o) return { x: o.x, y: o.y }; }
    if (G.npc) { const p = (lv.props || []).find(p => p.id === G.npc); if (p) return { x: p.x * Z.TILE + 8, y: (p.y + 1) * Z.TILE }; }
    return null;
  }
  function wire() {
    const act = ui().actions;
    act.aufAn = id => { const x = QI[id]; if (accept(id)) { A.play("ui", { vol: 0.4 }); ui().close(); sayAt(x.g, L(["Abgemacht.", "Deal."]) + " " + L(x.t), 3000); } };
    act.aufTausch = arg => { const [id, sw] = String(arg).split("|"); const x = QI[id]; if (accept(id, sw)) { A.play("ui", { vol: 0.4 }); ui().close(); sayAt(x.g, L(["Gute Wahl.", "Good choice."]), 2400); } };
    act.aufAb = id => { const x = QI[id]; decline(id); ui().close(); sayAt(x.g, L(["Dann eben nicht. Vielleicht beim nächsten Mal.", "Suit yourself. Maybe next time."]), 2400); };
    act.aufWeg = id => { const x = QI[id]; if (!x) return; ui().confirm(L(["Auftrag aufgeben?", "Abandon task?"]), L(x.t) + " – " + L(["Der Fortschritt geht verloren.", "Progress will be lost."]), L(["Aufgeben", "Abandon"]), () => { abandon(id); if (curG && Z.level && Z.level.hub) openGiver(curG); else openList(); }); };
    act.aufHol = id => { const x = collect(id); if (!x) return; ui().close(); ceremony(x); };
    act.aufFeierZu = g => { ui().close(); if (g && Z.level && Z.level.hub) openGiver(g); };
    act.aufLore = id => { ui().close(); openLore(id, curG || ""); };
    act.aufLoreZu = g => { ui().close(); if (g && g !== "liste") openGiver(g); else if (g === "liste") openList(); };
    act.aufZu = g => { const G = GIVER[g]; ui().close(); if (G.npc === "A" && ui().forge) ui().forge(); else if (G.npc === "B" && ui().codex) ui().codex(); else if (G.res && Z.lager && Z.lager.open) Z.lager.open(G.res); };
    act.aufGeber = g => { ui().close(); openGiver(g); };
    act.aufDoch = g => { const s = ST(); delete s.decG[g]; newsReset(); ui().close(); openGiver(g); };
    act.aufListe = () => { ui().close(); openList(); };
    act.aufHud = (_, b) => { Z.settings.auftrHud = Z.settings.auftrHud === false; Z.saveSettings && Z.saveSettings(); hudDirty = true; if (b) b.textContent = hudLabel(); };
    act.aufListeWeg = id => { const x = QI[id]; if (!x) return; ui().confirm(L(["Auftrag aufgeben?", "Abandon task?"]), L(x.t) + " – " + L(["Der Fortschritt geht verloren.", "Progress will be lost."]), L(["Aufgeben", "Abandon"]), () => { abandon(id); openList(); }); };
  }
  const hudLabel = () => "📜 " + L(["Aufträge im HUD: ", "Tasks in HUD: "]) + (Z.settings.auftrHud === false ? L(["aus", "off"]) : L(["an", "on"]));

  /* Übersicht (Pausemenü): alle aktiven Aufträge, Stand je Bewohner */
  function openList() {
    const s = ST();
    let h = "<h2>📜 " + L(["Aufträge", "Tasks"]) + ' <small class="hinweis">' + Object.keys(s.done).length + " / " + Q.length + " " + L(["erledigt", "done"]) + "</small></h2>";
    if (!s.akt.length) h += '<p class="hinweis">' + L(["Keine aktiven Aufträge. Sprich im Lager mit den Bewohnern – ein „!“ über dem Kopf heißt: Sie haben etwas für dich.", "No active tasks. Talk to the residents at camp – a '!' above their heads means they have something for you."]) + "</p>";
    for (const a of s.akt) { const x = QI[a.id]; h += '<div class="au-zeile"><span class="au-wer" style="--c:' + GIVER[x.g].col + '">' + esc(GIVER[x.g].n) + "</span>" + taskHTML(x, a) + (a.ok ? '<small class="au-klein">' + L(["Im Lager abholen", "Collect at camp"]) + "</small>" : '<button data-act="aufListeWeg" data-arg="' + x.id + '">' + L(["Aufgeben", "Abandon"]) + "</button>") + "</div>"; }
    h += "<h3>" + L(["Bewohner", "Residents"]) + '</h3><div class="au-geber">';
    for (const g in GIVER) {
      if (!present(g)) continue;
      const all = Q.filter(y => y.g === g), d = all.filter(y => s.done[y.id]).length, ch = Object.keys(CHAINS).find(k => CHAINS[k].g === g);
      const lores = all.filter(y => y.r && y.r.lore && s.lore[y.id]);
      h += '<div class="au-g" style="--c:' + GIVER[g].col + '"><b>' + esc(GIVER[g].n) + (Z.level && Z.level.hub ? ' <button class="au-mini" data-act="aufGeber" data-arg="' + g + '" title="' + esc(L(["Ansprechen", "Talk"])) + '" aria-label="' + esc(L(["Ansprechen: ", "Talk to "]) + GIVER[g].n) + '">💬</button>' : "") + "</b><small>" + d + " / " + all.length + (ch ? " · " + esc(L(CHAINS[ch].n)) + " " + chainStage(ch) + "/" + CHAINS[ch].len : "") + "</small>" +
        (lores.length ? lores.map(y => '<button class="au-mini" data-act="aufLoreL" data-arg="' + y.id + '" title="' + esc(L(y.r.lore[0])) + '" aria-label="' + esc(L(y.r.lore[0])) + '">📖</button>').join("") : "") + "</div>";
    }
    h += '</div><div class="knoepfe"><button data-act="aufHud">' + esc(hudLabel()) + '</button><button data-act="close" autofocus>' + L(["Zurück", "Back"]) + "</button></div>";
    ui().open(h, { cls: "lager auftr breit" });
    ui().actions.aufLoreL = id => { ui().close(); openLore(id, "liste"); };
  }

  /* ======================= INTERAKTION IM LAGER ======================= */
  function hookNPC() {
    const u = ui(); if (!u.npc || u.npc._auftr) return;
    const npc0 = u.npc;
    const byNpc = { G: "friedrich", E: "echo", B: "barradin", A: "nundro" };
    u.npc = function (id) {
      const g = byNpc[id];
      if (g && Z.level && Z.level.hub) {
        const nw = news(g);
        if (nw) { /* nur mit Neuigkeit (Belohnung oder frisches Angebot) – sonst wie gewohnt (Tipps, Schmiede, Fundbuch) */
          const s = Z.level.props.find(p => p.id === id), lv = Z.level;
          const line = nw === "lohn" ? L(QI[aktOf(g).id].d) : nw === "neu" ? L(Z.R.pick(GIVER[g].hi)) : null;
          if (line && s && u.say) u.say(s.x * Z.TILE + 8, s.y * Z.TILE - 22, GIVER[g].n, line, 2600);
          setTimeout(() => { if (!u.modalOpen && Z.level === lv && lv.hub && Z.player && !Z.player.dead) openGiver(g); }, 700);
          return;
        }
      }
      return npc0.apply(this, arguments);
    };
    u.npc._auftr = true;
  }
  /* Bewohner aus lager.js: ihr Benutzen-Eintrag wird umhüllt (Neuigkeit → Auftragsfenster, sonst wie gewohnt) */
  const RES2G = {}; for (const g in GIVER) if (GIVER[g].res) RES2G[GIVER[g].res] = g;
  function wrapInteracts() {
    for (const o of Z.interacts || []) {
      if (!o || !o.lagerRes || o._auftr) continue;
      const g = RES2G[o.lagerRes]; if (!g) continue;
      const use0 = o.use, lab0 = o.label; o._auftr = true;
      o.use = function () { const lr = M().lager && M().lager.res && M().lager.res[o.lagerRes]; if (lr && lr.met && news(g)) return openGiver(g); return use0.apply(this, arguments); }; /* erst Vorstellung (lager.js), dann Aufträge */
      if (lab0) o.label = function () { const nw = newsCached(g); return lab0.apply(this, arguments) + (nw === "lohn" ? " · 🎁 " + L(["Belohnung!", "Reward!"]) : nw === "neu" ? " · 📜 " + L(["Auftrag", "Task"]) : ""); };
    }
  }
  /* Bewohner-Menü aus lager.js: Knopf „Aufträge“ einsetzen */
  function hookOpen() {
    const u = ui(); if (!u.open || u.open._auftr) return;
    const open0 = u.open;
    u.open = function (html, o) {
      const r = open0.apply(this, arguments);
      try {
        const m = /data-res="([a-z]+)"/.exec(String(html || "")), g = m && RES2G[m[1]];
        if (g && o && /lager/.test(o.cls || "") && !/auftr/.test(o.cls || "")) {
          const ks = document.querySelectorAll("#modal .knoepfe"), k = ks.length ? ks[ks.length - 1] : null;
          if (k && !k.querySelector('[data-act="aufGeber"]')) { const b = document.createElement("button"); b.dataset.act = "aufGeber"; b.dataset.arg = g; const nw = news(g); b.textContent = "📜 " + L(["Aufträge", "Tasks"]) + (nw === "lohn" ? " 🎁" : nw === "neu" ? " !" : ""); k.insertBefore(b, k.firstChild); }
        }
      } catch (err) { console.error(err); }
      return r;
    };
    u.open._auftr = true;
  }
  /* Pausemenü: aktive Aufträge rechts, Knöpfe für Übersicht und HUD */
  function hookPause() {
    const u = ui(); if (!u.pause || u.pause._auftr) return;
    const p0 = u.pause;
    u.pause = function () {
      const r = p0.apply(this, arguments);
      try {
        const info = document.querySelector("#modal .pausenmenue .p-info"), k = document.querySelector("#modal .pausenmenue .knoepfe");
        if (info && !info.querySelector(".au-pause")) {
          const s = ST(), d = document.createElement("div"); d.className = "au-pause";
          d.innerHTML = "<h3>📜 " + L(["Aufträge", "Tasks"]) + " <small>" + s.akt.length + "/" + MAX_AKT + "</small></h3>" + (s.akt.length ? s.akt.map(a => { const x = QI[a.id]; return '<div class="au-pz"><span style="color:' + GIVER[x.g].col + '">' + esc(GIVER[x.g].n) + "</span> " + esc(L(x.t)) + bar(prog(a), x.n) + "<small>" + fmtN(prog(a)) + " / " + fmtN(x.n) + (a.ok ? " ✓ " + L(["abholen", "collect"]) : x.run ? " · " + L(["in einem Lauf", "in one run"]) : "") + "</small></div>"; }).join("") : '<p class="au-klein">' + L(["Keine – im Lager warten Bewohner mit Aufträgen.", "None – residents at camp have tasks for you."]) + "</p>");
          info.appendChild(d);
        }
        if (k && !k.querySelector('[data-act="aufListe"]')) { const b = document.createElement("button"); b.dataset.act = "aufListe"; b.textContent = "📜 " + L(["Aufträge", "Tasks"]); k.insertBefore(b, k.children[3] || null); }
      } catch (err) { console.error(err); }
      return r;
    };
    u.pause._auftr = true;
  }

  /* W39 Bedienung: 💬/📖-Knöpfe in der Auftragsliste mit Klartext für Vorleser (aria-label) */
  /* ======================= HUD ======================= */
  let hudEl = null, hudDirty = true, hudT = 0, hudKey = "";
  function hudTick(dt) {
    hudT -= dt; if (hudT > 0 && !hudDirty) return; hudT = 0.25; hudDirty = false;
    if (!hudEl) { const hl = document.querySelector("#hud .hl"); if (!hl) return; hudEl = document.createElement("div"); hudEl.id = "auftr-hud"; hudEl.setAttribute("aria-live", "off"); hl.appendChild(hudEl); }
    const s = ST(), off = Z.settings.auftrHud === false || !s.akt.length || !Z.level;
    const key = off ? "" : s.akt.map(a => a.id + ":" + prog(a) + (a.ok ? "!" : "")).join("|") + L(["d", "e"]);
    if (key === hudKey) return; hudKey = key;
    if (off) { hudEl.hidden = true; hudEl.innerHTML = ""; return; }
    hudEl.hidden = false;
    hudEl.innerHTML = s.akt.map(a => { const x = QI[a.id], p = prog(a); return '<div class="au-h' + (a.ok ? " ok" : "") + '" style="--c:' + GIVER[x.g].col + '"><i style="width:' + Math.round(p / x.n * 100) + '%"></i><span>' + (a.ok ? "🎁 " : "") + esc(L(x.t)) + "</span><b>" + (a.ok ? "✓" : fmtN(p) + "/" + fmtN(x.n)) + "</b></div>"; }).join("");
  }

  /* ======================= MARKIERUNG ÜBER DEN KÖPFEN ======================= */
  function drawMarks(c, t) {
    const lv = Z.level; if (!lv || !lv.hub) return;
    for (const g in GIVER) {
      const nw = newsCached(g); if (!nw) continue;
      const pos = giverPos(g); if (!pos) continue;
      const bob = Math.sin(t * 3 + pos.x * 0.05) * 1.5, x = pos.x, y = pos.y - 44 + bob;
      c.save();
      if (!lo()) { c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y, 9, nw === "lohn" ? "rgba(255,200,90,.55)" : "rgba(255,150,80,.45)"); c.globalCompositeOperation = "source-over"; }
      if (nw === "lohn") { /* kleine Schatzrolle mit Siegel */
        c.fillStyle = "#e8d8b0"; c.fillRect(x - 5, y - 3.5, 10, 7); c.fillStyle = "#c8b080"; c.fillRect(x - 6, y - 4, 1.6, 8); c.fillRect(x + 4.4, y - 4, 1.6, 8);
        Z.draw.circ(c, x, y + 1, 2.2, "#b0201a"); Z.draw.circ(c, x - 0.5, y + 0.5, 0.8, "#e05040");
      } else { /* Ausrufezeichen auf Pergamentscheibe */
        Z.draw.circ(c, x, y, 5, "#2a1810"); Z.draw.circ(c, x, y, 4.2, "#e5b454");
        c.fillStyle = "#3a1408"; c.fillRect(x - 0.8, y - 3, 1.6, 3.8); c.fillRect(x - 0.8, y + 1.6, 1.6, 1.4);
      }
      c.restore();
    }
  }

  /* ======================= GLUT FÜR DEN NÄCHSTEN LAUF ======================= */
  let glutRun = null;
  function glutTick() {
    const s = ST(), run = Z.run, P = Z.player;
    if (!run || !P || !s.glut || glutRun === run || !Z.level || Z.level.hub) return;
    glutRun = run; P.glut = (P.glut || 0) + s.glut;
    const n = s.glut; s.glut = 0; save();
    const u = ui(); if (u.notify) { try { u.notify("✦ <b>+" + n + " " + L(["Glut", "embers"]) + "</b><br><small>" + L(["Ein Geschenk aus dem Lager.", "A gift from the camp."]) + "</small>", { prio: 2, art: "gold", dauer: 3200 }); } catch (_) {} }
  }

  /* ======================= EINHÄNGEN ======================= */
  function late() {
    if (!Z.ui || !Z.ui.actions || !Z.ui.npc || !Z.ui.pause) return setTimeout(late, 60);
    addAch(); wire(); hookNPC(); hookOpen(); hookPause();
    /* Kills: äußerste Hülle (alle Spieler) */
    const k0 = Z.killEnemy;
    if (k0) Z.killEnemy = function (e, o) {
      const was = e && e.dead; const r = k0.apply(this, arguments);
      try { if (e && e.dead && !was && !e._aufK && !e.dummy && Z.run) { e._aufK = 1; const oo = o || {}; if (!oo.self) ev("kill", 1, killTags(e, oo)); } } catch (err) { console.error(err); }
      return r;
    };
    /* Treffer auf den Boss: Waffe oder Fähigkeit? */
    const h0 = Z.hitEnemy;
    if (h0) Z.hitEnemy = function (e, dmg, o) {
      try { if (fight && e === fight.e && o && (o.src === "melee" || o.src === "ranged" || o.src === "parry" || o.src === "thorns")) fight.weapon = true; } catch (_) {}
      return h0.apply(this, arguments);
    };
    /* Geschoss pariert */
    const sh0 = Z.shieldHook;
    Z.shieldHook = function (evn, P, o, dmg) { try { if (evn === "parry" && o && o.proj) ev("parryProj", 1); } catch (_) {} return sh0 ? sh0.apply(this, arguments) : undefined; };
    /* Gebiet verlassen / Lager betreten */
    const la0 = Z.loadArea;
    Z.loadArea = function (id, opts) {
      const prev = Z.level;
      try { areaLeave(prev, id, opts); } catch (err) { console.error(err); }
      const r = la0.apply(this, arguments);
      try { newsReset(); if (Z.level && Z.level.hub) wrapInteracts(); } catch (err) { console.error(err); }
      return r;
    };
    /* pro Schritt */
    const lt0 = Z.lagerTick;
    Z.lagerTick = function (dt) {
      const r = lt0 ? lt0.apply(this, arguments) : undefined;
      try { track(dt); glutTick(); hudTick(dt); if (saveT > 0 && (saveT -= dt) <= 0) { saveT = 0; save(); } if (Z.level && Z.level.hub) wrapInteracts(); } catch (err) { console.error(err); }
      return r;
    };
    const wp0 = Z.drawWorldProps;
    Z.drawWorldProps = function (c, t) { const r = wp0 ? wp0.apply(this, arguments) : undefined; try { drawMarks(c, t); } catch (err) { if (!drawErr) { drawErr = 1; console.error(err); } } return r; };
    if (Z.slots && Z.slots.onSwap) Z.slots.onSwap(() => { stRef = null; newsReset(); for (const k in base) delete base[k]; area = null; fight = null; hudDirty = true; hudKey = "-"; glutRun = null; });
    if (Z.level && Z.level.hub) wrapInteracts();
  }
  let drawErr = 0;

  /* ======================= GESTALTUNG ======================= */
  const css = document.createElement("style");
  css.textContent = [
    ".mbox.auftr .au-auftrag{background:linear-gradient(170deg,var(--perg,#ecdcb4),var(--perg2,#d3b986));color:var(--tinte,#2a1810);border:1px solid #8a6a3a;border-radius:5px;padding:7px 10px;margin:4px 0;box-shadow:inset 0 0 16px rgba(120,80,30,.3)}",
    ".mbox.auftr .au-auftrag b{display:block;font-size:var(--fs-m,15px)}.mbox.auftr .au-auftrag.fertig{box-shadow:inset 0 0 16px rgba(120,80,30,.3),0 0 0 2px #e5b454}",
    ".mbox.auftr .au-kette{display:inline-block;margin:3px 6px 0 0;font-size:var(--fs-xs,11px);font-weight:800;color:#7a1418;background:rgba(229,180,84,.35);border-radius:3px;padding:1px 6px}",
    ".mbox.auftr .au-lauf{display:inline-block;font-size:var(--fs-xs,11px);color:#5a3a1a;font-style:italic}",
    ".mbox.auftr .au-fort{margin-top:5px;background:#3a2a20;border-color:#6a4a2a}.mbox.auftr .au-zahl{font-weight:800;font-size:var(--fs-s,13px)}",
    ".mbox.auftr .au-lohn{margin:4px 0 6px 18px;padding:0;font-size:var(--fs-s,13px);color:var(--gold2,#ffd27a)}.mbox.auftr .au-lohn li{margin:1px 0}",
    ".mbox.auftr .au-wahl{flex-wrap:wrap;justify-content:flex-start}.mbox.auftr .au-wahl button small{opacity:.75}",
    ".mbox.auftr .au-klein{font-size:var(--fs-xs,11.5px);color:var(--mute,#ab9c8c);margin:4px 0}.mbox.auftr .au-voll{width:100%}",
    ".mbox.auftr .au-lore{display:flex;flex-wrap:wrap;gap:4px}.mbox.auftr .au-lore button{font-size:var(--fs-s,13px)}",
    ".mbox.auftr .au-feier{text-align:center}.mbox.auftr .au-feier .au-lohn{display:inline-block;text-align:left}.mbox.auftr .au-kettenende{font-weight:800;color:var(--gold2,#ffd27a);font-size:var(--fs-m,16px);text-shadow:0 0 10px rgba(229,120,40,.6)}",
    ".mbox.auftr .au-lore-txt{text-align:left;margin-top:8px}.mbox.auftr .au-lore-txt h3{margin:0 0 4px}",
    ".mbox.auftr .au-zeile{display:flex;gap:8px;align-items:center;margin:4px 0}.mbox.auftr .au-zeile .au-auftrag{flex:1}",
    ".mbox.auftr .au-wer{min-width:70px;font-weight:800;color:var(--c);text-shadow:0 1px 0 #000}",
    ".mbox.auftr .au-geber{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:5px}.mbox.auftr .au-g{border:1px solid #3b2e28;border-left:4px solid var(--c);border-radius:6px;padding:4px 8px;background:linear-gradient(#2a1a1e,#1a1014)}",
    ".mbox.auftr .au-g b{display:block}.mbox.auftr .au-g small{color:var(--mute,#ab9c8c)}.mbox.auftr .au-mini{padding:1px 5px;margin:2px 2px 0 0;min-height:0;font-size:12px}",
    ".pausenmenue .au-pause{margin-top:8px;border-top:1px solid #3b2e28;padding-top:6px}.pausenmenue .au-pause h3{margin:0 0 4px;font-size:var(--fs-s,14px)}",
    ".pausenmenue .au-pz{font-size:var(--fs-xs,12px);margin:3px 0}.pausenmenue .au-pz .lg-fort{height:5px;margin:2px 0;background:#1a1014;border:1px solid #33241f;border-radius:3px;overflow:hidden}.pausenmenue .au-pz .lg-fort i{display:block;height:100%;background:linear-gradient(90deg,#7a1418,#e5b454)}",
    ".pausenmenue .au-pz small{color:var(--mute,#ab9c8c)}",
    "#auftr-hud{display:flex;flex-direction:column;gap:2px;margin-top:4px;max-width:240px;pointer-events:none}",
    "#auftr-hud .au-h{position:relative;display:flex;gap:6px;align-items:center;font:700 11px/1.25 'Alegreya Sans',sans-serif;color:#f0e6d4;background:rgba(20,12,14,.62);border:1px solid rgba(90,60,40,.7);border-left:3px solid var(--c);border-radius:4px;padding:2px 6px;overflow:hidden;text-shadow:0 1px 0 #000}",
    "#auftr-hud .au-h i{position:absolute;left:0;bottom:0;height:2px;background:linear-gradient(90deg,#7a1418,#e5b454)}",
    "#auftr-hud .au-h span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9}#auftr-hud .au-h b{color:#ffd27a;font-variant-numeric:tabular-nums}",
    "#auftr-hud .au-h.ok{border-color:#e5b454;box-shadow:0 0 8px rgba(229,150,60,.45)}",
    "@media (max-width:760px),(max-height:500px){#auftr-hud{max-width:180px}#auftr-hud .au-h{font-size:10px;padding:1px 5px}}"
  ].join("\n");
  document.head.appendChild(css);

  /* ======================= SCHNITTSTELLE / TESTS ======================= */
  Z.auftr = {
    Q, QI, CHAINS, GIVER, state: ST, tier, offerOf, news, present, eligible, accept, decline, abandon, collect, ev,
    open: openGiver, list: openList, lore: openLore, chainDone, chainStage, prog: id => { const a = ST().akt.find(b => b.id === id); return a ? prog(a) : null; },
    /* Test: Auftrag sofort erfüllen */
    finish: id => { const a = ST().akt.find(b => b.id === id); if (!a || a.ok) return false; a.p = QI[id].n; a.ok = true; finished(QI[id]); return true; }
  };
  late();
})();
