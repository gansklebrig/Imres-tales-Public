/* Ezekiel – The Destroyer · Spuren
   Kleine Geschichten im Aufbau der Welt: Wer vor Ezekiel hier war, hat Spuren hinterlassen.
   Ein Abenteurer, der an der Wand zusammengesunken ist – sein Fund liegt noch neben ihm.
   Einer, der den kurzen Weg nach unten nehmen wollte. Ein Opfer der Falle direkt daneben.
   Ein letztes Gefecht hinter Kisten, ein erkaltetes Lager, ein Ritualkreis, ein Kokon im Netz, ein Ertrunkener.
   Neu: ein Kartenzeichner über seinen Pergamenten, ein Händler unter seinem umgestürzten Karren,
   ein Liebesbrief, der nie ankam, ein verkohlter Magier vor seinem Brandfleck, ein Zwerg mit zerbrochener Spitzhacke,
   ein Barde mit zerrissener Laute – und eine Truhe, die Zähne hatte.
   Jede Szene wird einmal ausführlich in ein Sprite gemalt; nur Rauch, Glut, Fliegen und Kleintiere bewegen sich.
   Wer nah herangeht, liest eingeritzte Worte. Treffer lassen Knochen klappern, Pergamente flattern, Glut stieben,
   die Laute nachklingen und die Zahntruhe schnappen; Fliegen stieben auseinander. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, CW = Z.CW, CH = Z.CH, L = v => Z.L(v), A = Z.audio;
  const TAU = Math.PI * 2, PI = Math.PI;
  let list = [], lvRef = null;

  const NOTES = {
    abenteurer: [
      ["„Nur noch kurz ausruhen.“", "“Just a short rest.”"],
      ["„Sagt Mira, ich hab es versucht.“", "“Tell Mira I tried.”"],
      ["„Der Schatz ist echt. Der Weg zurück nicht.“", "“The treasure is real. The way back isn't.”"],
      ["„Dritter Tag. Die Fackel wird schwächer.“", "“Day three. The torch grows weak.”"],
      ["„Wer das findet: nimm es. Ich brauch es nicht mehr.“", "“Whoever finds this: take it. I won't need it.”"],
      ["„Ich hätte Bauer werden sollen. Wie Vater gesagt hat.“", "“Should've been a farmer. Like Father said.”"],
      ["„Würfle nie gegen einen Goblin. Sie schummeln.“", "“Never roll dice against a goblin. They cheat.”"],
      ["„Der Kleriker hat gesagt, er kommt gleich wieder.“", "“The cleric said he'd be right back.”"],
      ["„Hier ruht Gerold. Er hat die Falle gefunden. Mit dem Gesicht.“", "“Here lies Gerold. He found the trap. With his face.”"],
      ["„Mein Heiltrank war Traubensaft. Danke, Händler.“", "“My healing potion was grape juice. Thanks, merchant.”"],
      ["„Sie singen nachts. Hinter den Wänden.“", "“They sing at night. Behind the walls.”"]
    ],
    sturz: [
      ["„Das Seil hält schon …“", "“The rope will hold…”"],
      ["Ein gerissenes Seil. Daneben ein Stiefel, ein zweiter fehlt.", "A snapped rope. One boot nearby, the other missing."],
      ["„Abkürzung“, steht auf einem Zettel. Durchgestrichen.", "“Shortcut,” says a note. Crossed out."],
      ["„Ich hab ’ne Zwanzig gewürfelt!“ – hat er nicht.", "“I rolled a twenty!” – he did not."],
      ["„Federfall? Dachte, DU hättest Federfall.“", "“Feather Fall? Thought YOU had Feather Fall.”"],
      ["Von oben sieht es nicht so tief aus. Von unten schon.", "From above it doesn't look that deep. From below it does."]
    ],
    falle: [
      ["Er hat die Platte zu spät gesehen.", "He saw the plate too late."],
      ["„Vorsicht, die zweite Stufe …“ – der Rest ist unleserlich.", "“Careful, the second step…” – the rest is illegible."],
      ["Ein Beutel Münzen. Seinem Besitzer hat er nichts genützt.", "A pouch of coins. Little good it did its owner."],
      ["„Ich prüfe auf Fallen.“ Er hat eine Eins gewürfelt.", "“I check for traps.” He rolled a one."],
      ["Daneben eine Stange, drei Meter lang. Nie benutzt.", "Next to him a ten-foot pole. Never used."]
    ],
    gefecht: [
      ["Pfeile in der Kiste, Pfeile in der Wand, Pfeile überall.", "Arrows in the crate, arrows in the wall, arrows everywhere."],
      ["„Sie kamen zu zehnt. Sieben hab ich erwischt.“", "“Ten of them came. I got seven.”"],
      ["Die Barrikade hat gehalten. Er nicht.", "The barricade held. He didn't."],
      ["„Haltet die Tür!“ – Niemand hat die Tür gehalten.", "“Hold the door!” – Nobody held the door."],
      ["Drei Goblinschädel. Einer grinst noch.", "Three goblin skulls. One is still grinning."]
    ],
    lager: [
      ["Die Asche ist kalt. Jemand hat hier gewartet – auf wen?", "The ashes are cold. Someone waited here – for whom?"],
      ["„Morgen gehen wir tiefer. Heute schlafen wir.“", "“Tomorrow we go deeper. Tonight we sleep.”"],
      ["Ein halber Laib Brot, steinhart. Und eine Karte voller Kreuze.", "Half a loaf, stone hard. And a map full of crosses."],
      ["„Wache: Barradin. Barradin schläft. Natürlich.“", "“Watch: Barradin. Barradin sleeps. Of course.”"],
      ["„Lange Rast. Endlich. Niemand würfelt auf Begegnungen.“", "“Long rest. Finally. Nobody roll for encounters.”"]
    ],
    ritual: [
      ["Kreide, Wachs, ein Kreis. Was immer gerufen wurde – es kam.", "Chalk, wax, a circle. Whatever was called – it came."],
      ["Die Runen glimmen noch. Nicht hineintreten.", "The runes still glimmer. Don't step in."],
      ["„Die Rote Robe verspricht Macht. Sie hat nicht gesagt, wem.“", "“The Red Robe promises power. It didn't say to whom.”"],
      ["Fünf Kerzen. Vier brennen noch. Wer zündet die fünfte?", "Five candles. Four still burn. Who lights the fifth?"]
    ],
    kokon: [
      ["Etwas zappelt nicht mehr im Netz.", "Something has stopped struggling in the web."],
      ["Ein Stiefel ragt aus dem Gespinst.", "A boot sticks out of the silk."],
      ["Der Kokon atmet. Oder ist es der Wind?", "The cocoon breathes. Or is it the wind?"],
      ["„Geht nicht in den Schlund“, hat jemand in den Stein geritzt. Darunter: „Zu spät.“", "“Don't go into the chasm,” someone scratched into the stone. Below it: “Too late.”"]
    ],
    ertrunken: [
      ["Algen in den Rippen. Der See gibt nichts zurück.", "Weed through the ribs. The lake gives nothing back."],
      ["„Der Steg war morsch.“", "“The pier was rotten.”"],
      ["Eine Kette am Knöchel. Jemand wollte, dass er unten bleibt.", "A chain on the ankle. Someone wanted him to stay down."],
      ["„Kuo-Toa sind harmlos“, sagte er. Sagte.", "“Kuo-toa are harmless,” he said. Said."]
    ],
    kartenzeichner: [
      ["Die Karte endet mitten im Raum. Genau hier.", "The map ends mid-room. Right here."],
      ["„Norden ist … oben? Nein. Dort.“ Vier Pfeile, vier Richtungen.", "“North is… up? No. There.” Four arrows, four directions."],
      ["„Hier sind Drachen.“ Durchgestrichen. „Hier sind Spinnen.“ Unterstrichen.", "“Here be dragons.” Crossed out. “Here be spiders.” Underlined."],
      ["„Die Gänge ändern sich, wenn man nicht hinsieht.“", "“The corridors change when you're not looking.”"],
      ["Feinste Tusche, gezittert. Die letzte Linie führt zu ihm selbst.", "Finest ink, trembling. The last line leads to himself."],
      ["„Kartographengilde, Bericht Nr. 37: Bitte schickt Verstärkung. Und Tinte.“", "“Cartographers' Guild, report no. 37: Please send reinforcements. And ink.”"]
    ],
    haendler: [
      ["„Waren aller Art! Fast unbenutzt!“", "“Goods of all kinds! Barely used!”"],
      ["Das Kassenbuch: „Einnahmen: 3 Silber. Ausgaben: ein Bein.“", "The ledger: “Income: 3 silver. Expenses: one leg.”"],
      ["„Der Esel ist weggelaufen. Kluges Tier.“", "“The mule ran off. Smart animal.”"],
      ["„Heiltränke! Garantiert echt!“ Sie waren es nicht.", "“Healing potions! Guaranteed genuine!” They weren't."],
      ["„Rückgabe ausgeschlossen.“ Das gilt jetzt für alles.", "“No refunds.” That applies to everything now."]
    ],
    liebesbrief: [
      ["„Liebste Elva, wenn du das liest, bin ich nicht zum Abendessen da.“", "“Dearest Elva, if you read this, I won't be home for supper.”"],
      ["„Ich komme zurück. Ganz bestimmt. Heb mir einen Tanz auf.“", "“I'll come back. I promise. Save me a dance.”"],
      ["Eine gepresste Rose. Die Farbe ist längst fort, der Duft nicht.", "A pressed rose. The colour is long gone, the scent is not."],
      ["„Ich hab den Ring. Ich frag dich, sobald ich hier raus bin.“", "“I have the ring. I'll ask you as soon as I get out of here.”"],
      ["Im Medaillon ein Bild. Sie lächelt. Er auch, irgendwie.", "In the locket a picture. She smiles. So does he, somehow."]
    ],
    magier: [
      ["„Feuerball in einem Gang. Was soll schon passieren.“", "“Fireball in a corridor. What could possibly go wrong.”"],
      ["Ein Schatten aus Ruß an der Wand. Er hat die Arme gehoben.", "A shadow of soot on the wall. He had his arms raised."],
      ["„Die Silbe war ‚ka‘, nicht ‚ko‘. Merkt euch das.“", "“The syllable was ‘ka’, not ‘ko’. Remember that.”"],
      ["Der Hut raucht noch. Nach all der Zeit.", "The hat is still smoking. After all this time."],
      ["„Konzentrationswurf …“ – mehr steht da nicht.", "“Concentration check…” – that's all it says."]
    ],
    zwerg: [
      ["„Der Fels war älter als ich. Und sturer.“", "“The rock was older than me. And more stubborn.”"],
      ["Der Bart ist noch geflochten. Ein Zwerg stirbt ordentlich.", "The beard is still braided. A dwarf dies tidy."],
      ["„Gold! Ich hab Gold gefunden!“ Daneben: ein Stück Messing.", "“Gold! I found gold!” Next to it: a lump of brass."],
      ["„Sagt Clan Steinfaust: Die Hacke war schuld.“", "“Tell Clan Stonefist: the pick was to blame.”"],
      ["Ein leerer Krug. Das letzte Bier wurde nicht verschwendet.", "An empty tankard. The last ale was not wasted."]
    ],
    barde: [
      ["„Das Lied vom tapferen Barden, Strophe eins.“ Es gibt keine zweite.", "“The Ballad of the Brave Bard, verse one.” There is no verse two."],
      ["„Ich hab versucht, den Oger zu bezirzen.“ Der Oger war nicht bezirzt.", "“I tried to seduce the ogre.” The ogre was not seduced."],
      ["Im Hut liegen drei Kupfermünzen. Trinkgeld für das letzte Konzert.", "Three copper coins in the hat. Tips for the final show."],
      ["Die Laute hat noch eine Saite. Sie klingt falsch.", "The lute has one string left. It's out of tune."],
      ["„Inspiration! Inspiration!“ – Niemand war inspiriert.", "“Inspiration! Inspiration!” – Nobody was inspired."]
    ],
    mimik: [
      ["Die Truhe hatte Zähne.", "The chest had teeth."],
      ["„Endlich, ein Schatz!“, waren seine letzten Worte.", "“Finally, treasure!” were his last words."],
      ["Sie schläft. Hoffentlich.", "It's sleeping. Hopefully."],
      ["Aus der Truhe ragen zwei Stiefel. Sie hat ihn nicht ganz geschafft.", "Two boots stick out of the chest. It didn't quite finish him."]
    ]
  };
  const WHO = { abenteurer: ["Eingeritzt", "Scratched"], sturz: ["Spuren", "Traces"], falle: ["Spuren", "Traces"], gefecht: ["Spuren", "Traces"], lager: ["Ein Tagebuch", "A diary"], ritual: ["Spuren", "Traces"], kokon: ["Spuren", "Traces"], ertrunken: ["Spuren", "Traces"],
    kartenzeichner: ["Eine Karte", "A map"], haendler: ["Ein Kassenbuch", "A ledger"], liebesbrief: ["Ein Brief", "A letter"], magier: ["Verkohlte Seiten", "Charred pages"], zwerg: ["In Runen geritzt", "Carved in runes"], barde: ["Ein Liederblatt", "A song sheet"], mimik: ["Spuren", "Traces"] };

  /* ---------- Plätze finden ---------- */
  function floorSpots(lv, c, half) {
    const out = [], ox = c.x * CW, oy = c.y * CH; half = half || 1;
    for (let y = oy + 1; y < oy + CH - 1; y++) for (let x = ox + 1 + half; x < ox + CW - 1 - half; x++) {
      let ok = true; for (let i = -half; i <= half; i++) if (!Z.standable(lv, x + i, y, 2)) { ok = false; break; }
      if (ok && lv.get(x, y + 1) !== 2) out.push([x, y]);
    }
    return out;
  }
  const airAbove = (lv, x, y) => { let n = 0; while (n < 20 && lv.get(x, y - n - 1) === 0) n++; return n; };
  const wallSide = (lv, x, y) => (lv.get(x - 1, y) === 1 ? -1 : lv.get(x + 1, y) === 1 ? 1 : 0);
  /* bevorzugte Gebiete für die neuen Geschichten */
  const PREF = {
    kartenzeichner: ["torhof", "keller", "hallen", "wehrgang", "verlies", "hafen", "glocken", "schlund", "schmiede", "zinnen", "see", "glut", "sturm"],
    haendler: ["torhof", "hallen", "hafen", "glut", "keller", "wehrgang"],
    liebesbrief: ["torhof", "keller", "hallen", "wehrgang", "verlies", "hafen", "glocken", "zinnen", "see", "sturm"],
    magier: ["hallen", "glocken", "zinnen", "schmiede", "verlies", "sturm", "schlund", "keller"],
    zwerg: ["schmiede", "glut", "schlund", "keller", "verlies", "see"],
    barde: ["torhof", "hallen", "hafen", "wehrgang", "keller", "glocken"],
    mimik: ["keller", "hallen", "verlies", "glocken", "schlund", "glut"]
  };
  function setup(lv) {
    list = []; lvRef = lv; SPR.clear();
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    let bh = 0; for (const ch of String(lv.biome)) bh = (bh * 31 + ch.charCodeAt(0)) >>> 0;
    const R = Z.Rng((((lv.seed || 1) * 2654435761) ^ bh) >>> 0);
    const biome = lv.biome, used = new Set();
    const near = (x, y) => (lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3) || (lv.start && Math.abs(lv.start.x - x) < 8 && Math.abs(lv.start.y - y) < 5) || list.some(s => Math.abs(s.x - x) < 10 && Math.abs(s.y - y) < 6) || (lv.traps || []).some(t => Math.abs(t.x - x) < 2 && Math.abs(t.y - y) < 2);
    const cells = Object.keys(lv.cells).map(k => lv.cells[k]).filter(c => c !== lv.startCell);
    R.shuffle(cells);
    const want = 3 + (R() < 0.6 ? 1 : 0) + (cells.length > 12 ? 1 : 0);
    const add = (kind, x, y, extra) => { list.push(Object.assign({ kind, x, y, seed: R() * 1000, flip: R() < 0.5 ? -1 : 1, note: R.pick(NOTES[kind]), read: false }, extra || {})); };
    /* 1) Opfer einer Falle: direkt neben einer Falle */
    const traps = (lv.traps || []).filter(t => "kzpfr".includes(t.t));
    if (traps.length && R() < 0.85) {
      for (let i = 0; i < 12; i++) { const t = R.pick(traps); for (const dx of [-2, 2, -3, 3]) { const x = t.x + dx, y = t.t === "r" || t.t === "p" ? (() => { let yy = t.y; while (yy < t.y + 14 && lv.get(x, yy + 1) === 0) yy++; return yy; })() : t.y; if (Z.standable(lv, x, y, 2) && !list.some(s => Math.abs(s.x - x) < 10 && Math.abs(s.y - y) < 6) && !(lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3)) { add("falle", x, y, { trap: t.t, flip: dx < 0 ? -1 : 1 }); i = 99; break; } } }
    }
    /* 2) Sturz: Fuß einer hohen Kante */
    for (const c of cells) {
      if (list.length >= want) break; if (used.has(c)) continue;
      const sp = floorSpots(lv, c).filter(([x, y]) => airAbove(lv, x, y) >= 9 && !near(x, y));
      if (sp.length && R() < 0.5) { const [x, y] = R.pick(sp); add("sturz", x, y); used.add(c); break; }
    }
    /* 3) die übrigen nach Gebiet – je Gebiet höchstens eine der neuen Geschichten doppelt */
    const kinds = ["abenteurer", "abenteurer", "gefecht", "lager"];
    if (["verlies", "schmiede", "glut", "keller", "hallen"].includes(biome)) kinds.push("ritual");
    if (biome === "schlund") kinds.push("kokon", "kokon");
    if (biome === "see" || biome === "hafen") kinds.push("ertrunken", "ertrunken");
    for (const k in PREF) if (PREF[k].includes(biome)) kinds.push(k, k);
    const count = {};
    for (const c of cells) {
      if (list.length >= want) break; if (used.has(c)) continue;
      let kind = c.dead && R() < 0.5 ? "gefecht" : R.pick(kinds);
      if ((count[kind] || 0) >= (kind === "abenteurer" ? 2 : 1)) kind = R.pick(kinds);
      if ((count[kind] || 0) >= 2) continue;
      const half = kind === "haendler" ? 3 : kind === "gefecht" || kind === "lager" || kind === "ritual" ? 2 : 1;
      const sp = floorSpots(lv, c, half).filter(([x, y]) => !near(x, y)); if (!sp.length) continue;
      let pick = sp;
      if (["abenteurer", "liebesbrief", "barde", "magier", "zwerg"].includes(kind)) { const w = sp.filter(([x, y]) => wallSide(lv, x, y)); if (w.length) pick = w; else if (kind === "magier") continue; }
      if (kind === "kokon") { const w = sp.filter(([x, y]) => airAbove(lv, x, y) >= 6); if (!w.length) continue; pick = w; }
      const [x, y] = R.pick(pick); const ws = wallSide(lv, x, y);
      add(kind, x, y, { wall: ws, flip: ws ? -ws : R() < 0.5 ? -1 : 1 }); used.add(c); count[kind] = (count[kind] || 0) + 1;
    }
    /* Beute: was der Tote zurückließ */
    for (const s of list) {
      const px = s.x * T + 8, py = (s.y + 1) * T, side = s.flip > 0 ? 14 : -14;
      const item = rar => { const it = Z.rollItem({ R, rar }); if (it) Z.spawnPickup("item", px + side, py - 2, { it, vx: 0, vy: 0, float: true }); };
      if (s.kind === "abenteurer" || s.kind === "kokon" || s.kind === "barde") item([40, 40, 16, 4]);
      else if (s.kind === "gefecht" || s.kind === "mimik") item([20, 50, 25, 5]);
      else if (s.kind === "zwerg") { item([30, 45, 20, 5]); Z.dropGold(px, py - 6, 10 + 8 * (Z.run ? Z.run.tier : 0)); }
      else if (s.kind === "falle" || s.kind === "ertrunken") Z.dropGold(px, py - 6, 12 + 10 * (Z.run ? Z.run.tier : 0));
      else if (s.kind === "haendler") { Z.dropGold(px - 10, py - 6, 20 + 14 * (Z.run ? Z.run.tier : 0)); if (Z.FOOD) Z.spawnPickup("food", px + 20, py - 2, { vx: 0, vy: 0, float: true, food: R.pick(Z.FOOD) }); }
      else if (s.kind === "magier" || s.kind === "kartenzeichner") Z.spawnPickup("scroll", px + side, py - 2, { vx: 0, vy: 0, float: true, stat: R.pick(["brut", "takt", "ueber"]) });
      else if (s.kind === "lager" || s.kind === "liebesbrief") Z.spawnPickup(R() < 0.5 ? "scroll" : "food", px + 16 * (s.flip || 1), py - 2, { vx: 0, vy: 0, float: true, stat: R.pick(["brut", "takt", "ueber"]), food: Z.FOOD && R.pick(Z.FOOD) });
    }
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "spuren", save: () => ({ list, lvRef }), load: s => { list = s.list; lvRef = s.lvRef; } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */

  /* ---------- Lesen ---------- */
  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    const P = Z.player; if (!P || P.dead || Z.level !== lvRef) return;
    for (const s of list) {
      if (s.read) continue;
      const dx = s.x * T + 8 - (P.x + P.w / 2), dy = (s.y + 1) * T - (P.y + P.h);
      if (Math.abs(dx) < 30 && Math.abs(dy) < 20) {
        s.read = true; Z.ui.say(s.x * T + 8, s.y * T - 10, L(WHO[s.kind]), L(s.note), 4200); A.play("scroll", { vol: 0.25 }); if (Z.stats) Z.stats.spuren = (Z.stats.spuren || 0) + 1;
        /* die Karte des Kartenzeichners deckt das Gebiet auf */
        if (s.kind === "kartenzeichner" && Z.fogSeen) { for (const k in lvRef.cells) Z.fogSeen().add(k); if (Z.toast) Z.toast(L(["Seine Karte zeigt dir das ganze Gebiet.", "His map shows you the whole area."]), 2600); }
        /* der Liebesbrief tröstet ein wenig */
        if (s.kind === "liebesbrief" && Z.healPlayer) { Z.healPlayer(P.hpMax * 0.1); Z.fx && Z.fx.text && Z.fx.text(P.x + P.w / 2, P.y - 10, L(["getröstet", "comforted"]), "#ffb0b0"); }
      }
    }
  };

  /* ======================= Malwerkzeuge ======================= */
  const BONE = "#d8cfb8", BONE2 = "#a89e88", BONED = "#6a6250";
  function E(c, x, y, rx, ry, col, rot) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU); c.fill(); }
  function B(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function P(c, col, p) { c.fillStyle = col; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); }
  function Ln(c, col, w, p) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke(); }
  function lg(c, x0, y0, x1, y1, cols) { const g = c.createLinearGradient(x0, y0, x1, y1); cols.forEach((s, i) => g.addColorStop(i / (cols.length - 1), s)); return g; }
  function rg(c, x, y, r, cols) { const g = c.createRadialGradient(x, y, 0, x, y, r); cols.forEach((s, i) => g.addColorStop(i / (cols.length - 1), s)); return g; }
  function shadow(c, x, y, rx, ry, a) { c.save(); c.translate(x, y); c.scale(1, ry / rx); c.fillStyle = rg(c, 0, 0, rx, ["rgba(0,0,0," + a + ")", "rgba(0,0,0," + a * 0.5 + ")", "rgba(0,0,0,0)"]); c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); }
  function rivet(c, x, y, r) { E(c, x, y, r, r, "#262022"); E(c, x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.45, "rgba(255,240,220,.55)"); }
  /* alter Blutfleck: braun, ausgefranst */
  function fleck(c, x, y, r, R) { c.fillStyle = "rgba(70,24,18,.45)"; c.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, rr = r * (0.7 + R() * 0.5); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.3); } c.fill(); for (let k = 0; k < 4; k++) E(c, x + (R() - 0.5) * r * 2.6, y + (R() - 0.5) * r * 0.5, 0.4 + R() * 0.6, 0.3, "rgba(70,24,18,.4)"); }
  function bone(c, x0, y0, x1, y1, w, far) {
    w = w || 1.2; c.lineCap = "round";
    Ln(c, far ? "#7a7262" : BONED, w + 0.35, [x0, y0 + 0.2, x1, y1 + 0.2]); Ln(c, far ? BONE2 : BONE, w, [x0, y0, x1, y1]);
    if (!far) Ln(c, "rgba(255,255,240,.45)", w * 0.3, [x0, y0 - w * 0.25, x1, y1 - w * 0.25]);
    c.lineCap = "butt";
    for (const [x, y] of [[x0, y0], [x1, y1]]) E(c, x, y, w * 0.72, w * 0.72, far ? BONE2 : BONE);
  }
  function skull(c, x, y, r, rot, jaw, col) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.fillStyle = rg(c, -r * 0.35, -r * 0.45, r * 1.7, [col ? col[0] : "#f0e8d4", col ? col[1] : BONE, col ? col[2] : "#8a8270"]); c.beginPath(); c.arc(0, -r * 0.1, r, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-r * 0.7, r * 0.3); c.quadraticCurveTo(-r * 0.6, r * 0.9, -r * 0.2, r * 0.95); c.lineTo(r * 0.2, r * 0.95); c.quadraticCurveTo(r * 0.6, r * 0.9, r * 0.7, r * 0.3); c.fill();
    E(c, -r * 0.4, 0, r * 0.28, r * 0.32, "#1a1214"); E(c, r * 0.4, 0, r * 0.28, r * 0.32, "#1a1214"); E(c, -r * 0.45, -r * 0.08, r * 0.08, r * 0.08, "rgba(255,255,255,.08)");
    P(c, "#2a2020", [0, r * 0.32, -r * 0.15, r * 0.6, r * 0.15, r * 0.6]);
    for (let k = -2; k <= 2; k++) { B(c, k * r * 0.19 - r * 0.07, r * 0.72, r * 0.14, r * 0.22, "#f4ecd8"); B(c, k * r * 0.19 + r * 0.07, r * 0.72, 0.2, r * 0.22, "rgba(40,30,20,.5)"); }
    if (jaw) { c.save(); c.translate(0, r * 0.95); c.rotate(jaw); c.fillStyle = col ? col[1] : BONE; c.beginPath(); c.moveTo(-r * 0.6, -r * 0.1); c.quadraticCurveTo(-r * 0.5, r * 0.5, 0, r * 0.55); c.quadraticCurveTo(r * 0.5, r * 0.5, r * 0.6, -r * 0.1); c.lineTo(r * 0.4, 0); c.lineTo(-r * 0.4, 0); c.fill(); for (let k = -1; k <= 1; k++) B(c, k * r * 0.2 - r * 0.07, -r * 0.05, r * 0.14, r * 0.18, "#f4ecd8"); c.restore(); }
    Ln(c, "rgba(60,50,40,.45)", 0.2, [r * 0.15, -r * 1.05, r * 0.32, -r * 0.55, r * 0.1, -r * 0.35]);
    E(c, -r * 0.35, -r * 0.6, r * 0.32, r * 0.18, "rgba(255,255,245,.4)", -0.4);
    c.restore();
  }
  function hand(c, x, y, a, far) { c.save(); c.translate(x, y); c.rotate(a); const col = far ? BONE2 : BONE; E(c, 0.4, 0, 0.8, 0.6, col); for (let k = -1.5; k <= 1.5; k += 1) Ln(c, col, 0.3, [0.8, k * 0.35, 2.2, k * 0.5]); Ln(c, col, 0.3, [0.3, -0.5, 1, -1.3]); c.restore(); }
  function stiefel(c, x, y, a, col, far) { c.save(); c.translate(x, y); c.rotate(a); col = col || "#4a3020"; const k = far ? "#2e1e14" : col; c.fillStyle = k; c.beginPath(); c.moveTo(-1.3, -3.4); c.lineTo(1.3, -3.4); c.lineTo(1.4, -0.6); c.lineTo(4, -0.6); c.quadraticCurveTo(4.6, 0.6, 3.6, 0.8); c.lineTo(-1.4, 0.8); c.closePath(); c.fill(); B(c, -1.5, -3.8, 3, 0.8, "#3a2416"); B(c, -1.4, 0.4, 5.2, 0.4, "#1e140e"); if (!far) B(c, -1.1, -3, 0.4, 3, "rgba(255,230,190,.2)"); c.restore(); }
  /* Gliedmaßen: Wurzel → Gelenk → Ende */
  function glied(c, r, m, e, kind, far, o) {
    bone(c, r[0], r[1], m[0], m[1], kind === "bein" ? 1.25 : 1, far);
    bone(c, m[0], m[1], e[0], e[1], kind === "bein" ? 1.1 : 0.9, far);
    const a = Math.atan2(e[1] - m[1], e[0] - m[0]);
    if (kind === "bein") { if (o && o.barfuss) { E(c, e[0] + 1, e[1], 1.4, 0.6, far ? BONE2 : BONE); } else stiefel(c, e[0], e[1], o && o.fussA != null ? o.fussA : 0, o && o.stiefel, far); }
    else hand(c, e[0], e[1], a, far);
  }
  /* zerrissener Stoff: Polygon mit Faltenwurf und ausgefranstem Rand */
  function lumpen(c, pts, col, R) {
    c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i] + (R() - 0.5) * 0.6, pts[i + 1] + (R() - 0.5) * 0.6); c.closePath(); c.fill(); c.clip();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    for (let k = 0; k < 5; k++) { const x = x0 + R() * (x1 - x0); Ln(c, "rgba(0,0,0,.25)", 0.5, [x, y0, x + (R() - 0.5) * 3, y1]); }
    c.fillStyle = "rgba(255,240,220,.08)"; c.fillRect(x0, y0, x1 - x0, (y1 - y0) * 0.3);
    for (let k = 0; k < 3; k++) E(c, x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 0.7 + R(), 0.5 + R() * 0.6, "rgba(0,0,0,.45)");
    c.restore();
  }
  /* Skelett aus Gelenkpunkten. J: hip, neck, head [x,y,rot], sh, arms [[ellbogen, hand], …], legs [[knie, fuß], …]; das zweite Glied liegt hinten */
  function skelett(c, J, o, R) {
    o = o || {};
    const [hx, hy] = J.hip, [nx, ny] = J.neck, a = Math.atan2(ny - hy, nx - hx), len = Math.hypot(nx - hx, ny - hy);
    if (J.arms[1]) glied(c, J.sh, J.arms[1][0], J.arms[1][1], "arm", true);
    if (J.legs[1]) glied(c, J.hip, J.legs[1][0], J.legs[1][1], "bein", true, { stiefel: o.stiefel, barfuss: o.barfuss, fussA: J.fuss && J.fuss[1] });
    if (o.umhang) lumpen(c, o.umhang, o.umhangCol || "#3a2a2a", R);
    /* Becken */
    c.save(); c.translate(hx, hy); c.rotate(a + PI / 2); E(c, 0, 0.6, 2.4, 1.6, BONE2); E(c, 0, 0.4, 1.6, 1, BONED); E(c, -1.2, 0.2, 0.6, 0.5, "#1a1214"); E(c, 1.2, 0.2, 0.6, 0.5, "#1a1214"); c.restore();
    /* Wirbelsäule */
    for (let k = 0; k <= 8; k++) { const u = k / 8, x = hx + (nx - hx) * u + Math.sin(u * PI) * 0.6 * Math.cos(a + PI / 2), y = hy + (ny - hy) * u + Math.sin(u * PI) * 0.6 * Math.sin(a + PI / 2); E(c, x, y, 0.62, 0.55, k % 2 ? BONE2 : BONE); }
    /* Rippen */
    c.save(); c.translate(hx + (nx - hx) * 0.62, hy + (ny - hy) * 0.62); c.rotate(a - PI / 2);
    for (let k = 0; k < 5; k++) { const yy = -len * 0.3 + k * len * 0.13, ww = 3.4 - Math.abs(k - 1.6) * 0.35; c.strokeStyle = k % 2 ? BONE2 : BONE; c.lineWidth = 0.65; c.beginPath(); c.ellipse(0, yy, ww, 1.4, 0, PI * 0.08, PI * 0.92); c.stroke(); c.strokeStyle = "rgba(60,50,40,.35)"; c.lineWidth = 0.25; c.beginPath(); c.ellipse(0, yy + 0.4, ww, 1.4, 0, PI * 0.15, PI * 0.85); c.stroke(); }
    E(c, 0, -len * 0.42, 2, 0.6, BONE); c.restore();
    if (o.tunika) lumpen(c, o.tunika, o.tunikaCol || "#5a2828", R);
    if (o.guertel) { c.save(); c.translate(hx + (nx - hx) * 0.2, hy + (ny - hy) * 0.2); c.rotate(a - PI / 2); B(c, -3.4, -0.5, 6.8, 1, "#3a2414"); B(c, -0.6, -0.7, 1.2, 1.4, "#b8923a"); if (o.beutel) { E(c, 2.6, 1.4, 1.2, 1.5, "#6a4a2a"); B(c, 2, 0, 1.2, 0.5, "#3a2414"); } c.restore(); }
    glied(c, J.sh, J.arms[0][0], J.arms[0][1], "arm", false);
    if (J.legs[0]) glied(c, J.hip, J.legs[0][0], J.legs[0][1], "bein", false, { stiefel: o.stiefel, barfuss: o.barfuss, fussA: J.fuss && J.fuss[0] });
    skull(c, J.head[0], J.head[1], o.kopf || 2.9, J.head[2], o.kiefer, o.schaedelCol);
    if (o.helm) helm(c, J.head[0], J.head[1], o.kopf || 2.9, J.head[2], o.helm);
  }
  function helm(c, x, y, r, rot, art) {
    c.save(); c.translate(x, y); c.rotate(rot);
    const st = art === "zwerg" ? "#8a7a6a" : "#82807c";
    c.fillStyle = lg(c, -r, -r * 1.4, r, 0, ["#b2b0ac", st, "#3c3a38"]); c.beginPath(); c.arc(0, -r * 0.15, r * 1.1, PI, 0); c.lineTo(r * 1.15, 0); c.lineTo(-r * 1.15, 0); c.fill();
    B(c, -r * 1.2, -r * 0.1, r * 2.4, r * 0.32, "#5c5a58");
    if (art === "zwerg") { for (const sd of [-1, 1]) { c.fillStyle = "#e8dcc0"; c.beginPath(); c.moveTo(sd * r * 0.9, -r * 0.6); c.quadraticCurveTo(sd * r * 2.2, -r * 1, sd * r * 2.1, -r * 2.2); c.quadraticCurveTo(sd * r * 1.6, -r * 1.2, sd * r * 0.7, -r * 0.95); c.fill(); } }
    else { B(c, -0.3, -r * 1.3, 0.6, r * 1.2, "#5c5a58"); }
    E(c, -r * 0.4, -r * 0.8, r * 0.3, r * 0.15, "rgba(255,255,255,.4)", -0.4);
    c.restore();
  }
  function schwert(c, x, y, a, col) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = lg(c, -0.9, 0, 0.9, 0, ["#dcdad6", col || "#a09e9a", "#5c5a58"]); c.beginPath(); c.moveTo(-0.8, -2); c.lineTo(-0.8, -14); c.lineTo(0, -15.6); c.lineTo(0.8, -14); c.lineTo(0.8, -2); c.fill(); Ln(c, "rgba(255,255,255,.6)", 0.25, [-0.3, -3, -0.3, -14]); for (let k = 0; k < 3; k++) E(c, (Math.sin(k * 7) * 0.4), -5 - k * 3.4, 0.4, 0.5, "rgba(140,70,30,.45)"); B(c, -3, -2.2, 6, 1.2, "#6a5a2a"); B(c, -0.7, -0.8, 1.4, 4, "#3a2414"); for (let k = 0; k < 3; k++) B(c, -0.7, -0.4 + k * 1.2, 1.4, 0.3, "#5a3a22"); E(c, 0, 3.8, 0.9, 0.9, "#b8923a"); c.restore(); }
  function pfeil(c, x, y, a, l) { l = l || 8; c.save(); c.translate(x, y); c.rotate(a); Ln(c, "#7a5a32", 0.6, [0, 0, -l, 0]); P(c, "#e8e0d0", [-l + 2, 0, -l, -1.3, -l + 0.6, 0]); P(c, "#a83030", [-l + 2, 0, -l, 1.3, -l + 0.6, 0]); P(c, "#7e7c7a", [0, -0.6, 1.4, 0, 0, 0.6]); c.restore(); }
  function rucksack(c, x, y, col, R) {
    col = col || "#6a4a2a"; c.fillStyle = lg(c, x - 4, y - 9, x + 4, y, [col, "#3a2414"]); c.beginPath(); c.moveTo(x - 3.6, y); c.quadraticCurveTo(x - 4.6, y - 5, x - 3, y - 8.4); c.lineTo(x + 3, y - 8.4); c.quadraticCurveTo(x + 4.6, y - 5, x + 3.6, y); c.fill();
    c.fillStyle = "#5a3a22"; c.beginPath(); c.moveTo(x - 3.2, y - 8.4); c.quadraticCurveTo(x, y - 10.4, x + 3.2, y - 8.4); c.lineTo(x + 3, y - 5); c.lineTo(x - 3, y - 5); c.fill(); B(c, x - 0.6, y - 6, 1.2, 1.4, "#b8923a");
    E(c, x, y - 10.6, 4.4, 1.6, "#8a6a4a"); for (let k = -3; k <= 3; k += 1.5) Ln(c, "rgba(40,24,10,.4)", 0.25, [x + k, y - 12, x + k, y - 9.2]); B(c, x - 3.6, y - 10.8, 0.6, 0.6, "#3a2414"); B(c, x + 3, y - 10.8, 0.6, 0.6, "#3a2414");
    c.strokeStyle = "#a08050"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x + 3.6, y - 3, 1.6, 2.2, 0.3, 0, TAU); c.stroke();
  }
  function fackel(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); B(c, 0, -0.7, 7, 1.4, "#4a3020"); B(c, 0, -0.7, 7, 0.4, "rgba(255,220,180,.2)"); c.fillStyle = "#1a1210"; c.beginPath(); c.ellipse(8, 0, 1.6, 1.2, 0, 0, TAU); c.fill(); B(c, 6.4, -0.9, 0.6, 1.8, "#7a6a5a"); c.restore(); }
  function muenzen(c, x, y, n, R) { for (let k = 0; k < n; k++) { const mx = x + (R() - 0.5) * 6, my = y - R() * 0.6; E(c, mx, my, 0.9, 0.35, R() < 0.3 ? "#c89a30" : "#e5c46a"); E(c, mx - 0.3, my - 0.1, 0.3, 0.12, "rgba(255,250,220,.8)"); } }
  function papier(c, x, y, w, h, a, R, linien) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(-w / 2 + 0.4, -h / 2 + 0.4, w, h); c.fillStyle = lg(c, -w / 2, -h / 2, w / 2, h / 2, ["#efe4c8", "#d8c8a0", "#b8a478"]); c.fillRect(-w / 2, -h / 2, w, h); if (linien) for (let k = 0; k < linien; k++) B(c, -w / 2 + 0.8, -h / 2 + 1 + k * (h - 2) / linien, w * (0.5 + R() * 0.4), 0.25, "rgba(60,40,30,.5)"); E(c, w / 2 - 1, h / 2 - 1, 1, 0.7, "rgba(140,110,70,.4)"); c.restore(); }
  function karte(c, x, y, w, h, a, R) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(-w / 2 + 0.5, -h / 2 + 0.5, w, h);
    c.fillStyle = lg(c, -w / 2, -h / 2, w / 2, h / 2, ["#efe2c0", "#d8c49a", "#b89c6c"]); c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = "rgba(90,50,30,.65)"; c.lineWidth = 0.3; c.strokeRect(-w / 2 + 0.6, -h / 2 + 0.6, w - 1.2, h - 1.2);
    c.beginPath(); let px = -w / 2 + 1.5, py = (R() - 0.5) * h * 0.5; c.moveTo(px, py); for (let k = 0; k < 6; k++) { px += w / 7; py += (R() - 0.5) * h * 0.4; py = Math.max(-h / 2 + 1, Math.min(h / 2 - 1, py)); c.lineTo(px, py); } c.stroke();
    for (let k = 0; k < 4; k++) { const rx = -w / 2 + 1.5 + R() * (w - 5), ry = -h / 2 + 1 + R() * (h - 4); c.strokeRect(rx, ry, 1.6 + R() * 2, 1.2 + R()); }
    c.strokeStyle = "rgba(150,40,30,.8)"; c.lineWidth = 0.35; const kx = (R() - 0.5) * w * 0.5, ky = (R() - 0.5) * h * 0.4; c.beginPath(); c.moveTo(kx - 0.8, ky - 0.8); c.lineTo(kx + 0.8, ky + 0.8); c.moveTo(kx + 0.8, ky - 0.8); c.lineTo(kx - 0.8, ky + 0.8); c.stroke();
    c.restore();
  }
  function kerze(c, x, y, h, w, col) { col = col || "#e8dcc0"; c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, ["#f4ecd8", col, "#a89a7a"]); c.fillRect(x - w / 2, y - h, w, h); E(c, x - w / 2 + 0.15, y - h + 1.2, 0.3, 1, col); E(c, x, y - h, w / 2, 0.3, "#f8f0e0"); B(c, x - 0.12, y - h - 0.8, 0.24, 0.8, "#1a1210"); E(c, x, y, w * 0.9, 0.35, "rgba(232,220,192,.7)"); }
  function kiste(c, x, y, w, h, col, R) {
    const nb = Math.max(2, Math.round(h / 3)); for (let i = 0; i < nb; i++) { c.fillStyle = lg(c, 0, y + i * h / nb, 0, y + (i + 1) * h / nb, ["#8a6440", col, "#4a2e1a"]); c.fillRect(x, y + i * h / nb, w, h / nb - 0.25); Ln(c, "rgba(30,14,6,.3)", 0.2, [x + 1, y + (i + 0.5) * h / nb, x + w - 1, y + (i + 0.4) * h / nb]); }
    B(c, x, y, 1.3, h, "#4a2e1a"); B(c, x + w - 1.3, y, 1.3, h, "#4a2e1a"); for (const [nx, ny] of [[x + 0.65, y + 0.8], [x + w - 0.65, y + 0.8], [x + 0.65, y + h - 0.8], [x + w - 0.65, y + h - 0.8]]) rivet(c, nx, ny, 0.3);
  }
  function fliegen(c, x, y, t, n, ph) { for (let i = 0; i < n; i++) { const a = t * (2.2 + i * 0.7) + ph + i * 2.1, fx = x + Math.sin(a) * (3 + i) + Math.sin(a * 2.7) * 1.2, fy = y - 3 - Math.abs(Math.cos(a * 1.3)) * (3 + i * 0.6); B(c, fx - 0.4, fy - 0.3, 0.8, 0.6, "#140e10"); if ((t * 40 + i * 7) % 2 < 1) B(c, fx - 0.6, fy - 0.8, 1.2, 0.4, "rgba(230,230,220,.45)"); } }
  function rauch(c, x, y, t, ph, n, col) { for (let k = 0; k < n; k++) { const u = (t * 0.4 + ph + k / n) % 1; E(c, x + Math.sin(u * 5 + ph) * 2 * u + (Z.windX || 0) * u * 0.1, y - u * 16, 0.8 + u * 3, 0.8 + u * 3, "rgba(" + (col || "120,110,110") + "," + 0.22 * (1 - u) * Math.min(1, u * 5) + ")"); } }

  /* ======================= Szenen (statisch, gecacht) ======================= */
  const BOX = { kokon: [-34, -96, 34, 6], sturz: [-30, -48, 30, 6], haendler: [-48, -36, 48, 6], magier: [-36, -52, 36, 6], gefecht: [-46, -30, 46, 6], ritual: [-30, -30, 30, 6], lager: [-30, -30, 30, 6], kartenzeichner: [-34, -34, 34, 6] };
  const DEFBOX = [-34, -36, 34, 6];
  const TUNIKA = ["#5a2828", "#2a4a3a", "#4a3a2a", "#3a2a4a", "#5a4a2a"];
  /* sitzende Haltung an der Wand (Wand links) */
  const SITZ = { hip: [-3, -2.6], neck: [-4.8, -12.6], head: [-3.4, -16.4, 0.45], sh: [-4.6, -11.6], arms: [[[-1.6, -6.8], [2.6, -4.8]], [[-6.6, -7], [-7.6, -1.2]]], legs: [[[3.6, -7.2], [7.4, -0.8]], [[5.4, -3.4], [10.6, -0.8]]] };
  const LIEG = { hip: [2, -2.2], neck: [-8.4, -2.6], head: [-11.4, -2.8, 1.5], sh: [-7.6, -2.6], arms: [[[-4.6, -5.6], [-1.4, -4.4]], [[-9.6, -1], [-13.6, -0.6]]], legs: [[[7.4, -4.4], [12.4, -0.8]], [[8, -1.6], [14, -1]]], fuss: [0.2, 0.1] };
  const SPLAT = { hip: [1, -1.8], neck: [-7, -2.4], head: [-10.4, -2, 2.2], sh: [-6.4, -2.4], arms: [[[-5, -7.4], [-2, -10.6]], [[-9, -0.6], [-12.4, -0.4]]], legs: [[[6, -1.4], [9.6, -5.4]], [[5.6, -0.8], [11, -0.6]]], fuss: [-0.8, 0.1] };
  function szene(c, s, R) {
    const v = (s.seed | 0) % 5, tun = TUNIKA[v];
    switch (s.kind) {
      case "abenteurer": {
        shadow(c, 0, 0.5, 16, 2, 0.4); fleck(c, 2, 0, 5, R);
        if (s.wall) {
          rucksack(c, -10, 0, "#6a4a2a", R);
          skelett(c, SITZ, { tunika: [-7.6, -12.4, -2, -13.6, 0.6, -6, -0.4, -1.6, -6, -1.6], tunikaCol: tun, umhang: [-8, -14, -5, -14.6, -7, 0, -10.4, 0], umhangCol: "#3a2a26", guertel: true, beutel: v % 2, helm: v === 2 ? "eisen" : null, kiefer: 0.25 }, R);
          c.strokeStyle = "rgba(230,224,236,.4)"; c.lineWidth = 0.2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-8, -19); c.lineTo(-3 + k * 1.2, -18 + k * 0.4); c.stroke(); }
        } else skelett(c, LIEG, { tunika: [-8, -4.6, 1, -4.6, 2, -0.4, -8, -0.4], tunikaCol: tun, guertel: true, beutel: 1, kiefer: 0.4 }, R);
        schwert(c, -12, -0.6, -1.45);
        fackel(c, 9, -1, 0.05);
        if (v === 3) { c.fillStyle = lg(c, 12, -10, 20, 0, ["#8a2a2a", "#4a1414"]); c.beginPath(); c.ellipse(16, -5, 4.4, 5.6, -0.25, 0, TAU); c.fill(); c.strokeStyle = "#c8b080"; c.lineWidth = 0.6; c.stroke(); E(c, 16, -5, 1.2, 1.2, "#c8a040"); }
        else { c.fillStyle = "#8a6a3a"; c.beginPath(); c.ellipse(15, -1.4, 2.4, 1.6, 0, 0, TAU); c.fill(); B(c, 14.6, -3.6, 0.8, 1, "#3a2414"); E(c, 13.4, -2, 0.6, 0.4, "rgba(255,240,200,.3)"); }
        break;
      }
      case "sturz": {
        shadow(c, 0, 0.5, 16, 2, 0.4); fleck(c, -1, 0, 7, R);
        skelett(c, SPLAT, { tunika: [-7, -4.4, 1.4, -4, 2, -0.2, -7, -0.4], tunikaCol: tun, umhang: [-6, -0.6, 4, -1, 10, -0.2, 6, 0.6, -4, 0.6], umhangCol: "#3a3030", guertel: true }, R);
        stiefel(c, -16, -1, 1.3, "#4a3020");
        /* gerissenes Seil: Rolle am Boden und ein Ende von oben */
        c.strokeStyle = "#a08050"; c.lineWidth = 0.9; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(15, -1.4 - k * 0.6, 5 - k * 0.5, 1.4, 0, 0, TAU); c.stroke(); }
        c.beginPath(); c.moveTo(15, -3); c.bezierCurveTo(19, -12, 11, -24, 17, -34); c.stroke(); for (let k = 0; k < 4; k++) Ln(c, "#c8a870", 0.25, [17, -34, 15.4 + k, -37 - k * 0.6]);
        c.save(); c.translate(-20, -1.6); c.rotate(0.4); c.fillStyle = lg(c, -3, -3, 3, 0, ["#a09e9a", "#4a4a54"]); c.beginPath(); c.arc(0, 0, 3, PI, 0); c.fill(); B(c, -3.4, -0.2, 6.8, 0.9, "#3c3a38"); c.restore();
        for (let k = 0; k < 6; k++) P(c, "#6a6068", [-6 + R() * 18, 0, -5 + R() * 18, -1 - R(), -4 + R() * 18, 0]);
        break;
      }
      case "falle": {
        shadow(c, 0, 0.5, 16, 2, 0.4); fleck(c, 0, 0, 7, R);
        skelett(c, LIEG, { tunika: [-8, -4.6, 1, -4.6, 2, -0.4, -8, -0.4], tunikaCol: tun, guertel: true, kiefer: 0.5 }, R);
        if (s.trap === "p" || s.trap === "f") { for (let k = 0; k < 3; k++) pfeil(c, -6 + k * 4, -4 - k, 0.3 + k * 0.4, 7); }
        else { for (let k = 0; k < 4; k++) P(c, "#82807c", [-5 + k * 3, 0, -4 + k * 3, -5 - k % 2 * 2, -3 + k * 3, 0]); }
        c.fillStyle = "#7a5a32"; c.beginPath(); c.ellipse(-16, -1.6, 2.8, 2.2, 0, 0, TAU); c.fill(); Ln(c, "#3a2414", 0.5, [-17.4, -3.4, -14.6, -3.4]); muenzen(c, -12, -0.2, 8, R);
        c.save(); c.translate(14, -1.4); c.rotate(-0.05); B(c, -9, -0.5, 18, 1, "#8a6a40"); c.restore();
        break;
      }
      case "gefecht": {
        shadow(c, 0, 0.5, 30, 2.4, 0.4); fleck(c, -6, 0, 8, R);
        for (let k = 0; k < 3; k++) { const bx = 14 + k * 9, h = 8 + (k % 2) * 6; kiste(c, bx - 4.5, -h, 9, h, "#6a4428", R); pfeil(c, bx - 2, -h + 3, PI - 0.15, 7); pfeil(c, bx + 2, -h + 6 + k, PI + 0.2, 6); }
        B(c, 12, -15, 24, 1.4, "#5a3a22");
        skelett(c, { hip: [3, -2.6], neck: [4.8, -12.6], head: [3.6, -16.2, -0.5], sh: [4.6, -11.6], arms: [[[1, -8], [-2.6, -5]], [[7, -7], [8, -1.4]]], legs: [[[-3.4, -7], [-7, -0.8]], [[-5, -3.4], [-10.6, -0.8]]] }, { tunika: [1.6, -13, 7.6, -12, 7, -1.6, 0.6, -1.6], tunikaCol: tun, guertel: true, helm: "eisen" }, R);
        c.fillStyle = lg(c, -4, -14, 4, -2, ["#7a6a5a", "#4a3a2a"]); c.beginPath(); c.ellipse(-1.4, -8, 4.2, 6, 0, 0, TAU); c.fill(); c.strokeStyle = "#a08a6a"; c.lineWidth = 0.7; c.stroke(); E(c, -1.4, -8, 1.2, 1.2, "#8e8c8a");
        for (let k = 0; k < 4; k++) pfeil(c, -2 + k * 0.6, -11 + k * 2, PI - 0.3 + k * 0.15, 6);
        for (let k = 0; k < 3; k++) { const gx = -16 - k * 8, gy = -2.2; skull(c, gx, gy, 2.2, k * 0.7 - 0.6, 0.3, ["#d8e0b0", "#b8c090", "#6a7050"]); P(c, "#e8e0c8", [gx - 1, gy + 1.6, gx - 1.4, gy + 3, gx - 0.6, gy + 1.8]); P(c, "#e8e0c8", [gx + 1, gy + 1.6, gx + 1.4, gy + 3, gx + 0.6, gy + 1.8]); }
        for (let k = 0; k < 7; k++) pfeil(c, -10 - k * 4, -0.6, -0.4 + R() * 0.6, 7);
        c.save(); c.translate(-36, -1); c.rotate(-0.1); B(c, 0, -0.4, 14, 0.8, "#6a4a2a"); P(c, "#8e8c8a", [14, -1, 17, 0, 14, 1]); c.restore(); B(c, -28, -1.4, 5, 0.8, "#6a4a2a");
        break;
      }
      case "lager": {
        shadow(c, 0, 0.5, 24, 2, 0.35);
        c.fillStyle = lg(c, -22, -3, -6, 0, ["#7a5040", "#4a2e24"]); c.beginPath(); c.moveTo(-22, 0); c.lineTo(-22, -2.4); c.quadraticCurveTo(-14, -3.6, -6, -2.4); c.lineTo(-6, 0); c.fill(); E(c, -21, -2.8, 2.4, 2, "#8a6a4a"); for (let k = 0; k < 4; k++) Ln(c, "rgba(0,0,0,.3)", 0.3, [-19 + k * 3.4, -3, -18.6 + k * 3.4, 0]);
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; E(c, 4 + Math.cos(a) * 5.4, -0.8 + Math.sin(a) * 1, 1.6, 1.2, k % 2 ? "#5a5058" : "#6a6068"); }
        E(c, 4, -0.8, 4, 0.8, "#1a1414"); for (const [a] of [[0.5], [-0.5], [0.1]]) { c.save(); c.translate(4, -1.4); c.rotate(a); B(c, -4, -0.6, 8, 1.2, "#2a1a14"); B(c, 2, -0.6, 2, 1.2, "#1a1010"); c.restore(); }
        for (const sd of [-1, 1]) Ln(c, "#3a3436", 0.6, [4 + sd * 5, 0, 4 + sd * 1.6, -10]); Ln(c, "#3a3436", 0.6, [2, -10, 6, -10]);
        c.fillStyle = lg(c, 14, -6, 20, 0, ["#5a5658", "#2a2628"]); c.beginPath(); c.arc(17, -3.6, 3.4, 0, PI); c.fill(); B(c, 13.4, -4, 7.2, 0.8, "#3a3436"); c.strokeStyle = "#3a3436"; c.lineWidth = 0.4; c.beginPath(); c.arc(17, -4, 3.6, PI, 0); c.stroke();
        karte(c, -11, -0.6, 8, 5, -0.15, R);
        E(c, 23, -1.6, 2.6, 1.6, "#a8783a"); E(c, 22.4, -2, 1.8, 0.9, "#c89a50"); /* Brot */
        rucksack(c, -26, 0, "#5a4a3a", R);
        if (v % 2) { c.save(); c.translate(10, -0.4); c.rotate(-0.2); E(c, 0, 0, 1.6, 2.4, "#6a4a2a"); B(c, -0.4, -3, 0.8, 1, "#3a2414"); c.restore(); }
        break;
      }
      case "ritual": {
        c.strokeStyle = "rgba(232,224,208,.65)"; c.lineWidth = 0.7; c.beginPath(); c.ellipse(0, -0.6, 22, 3.2, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, -0.6, 16, 2.2, 0, 0, TAU); c.stroke();
        for (let k = 0; k < 5; k++) { const a1 = -PI / 2 + k * TAU * 2 / 5, a2 = -PI / 2 + (k + 1) * TAU * 2 / 5; Ln(c, "rgba(232,224,208,.5)", 0.4, [Math.cos(a1) * 16, -0.6 + Math.sin(a1) * 2.2, Math.cos(a2) * 16, -0.6 + Math.sin(a2) * 2.2]); }
        for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = Math.cos(a) * 19, y = -0.6 + Math.sin(a) * 2.7; Ln(c, "rgba(232,224,208,.6)", 0.3, [x - 0.6, y - 0.3, x, y + 0.3, x + 0.6, y - 0.3]); }
        c.fillStyle = "rgba(10,6,6,.75)"; c.beginPath(); c.ellipse(0, -0.8, 9, 1.8, 0, 0, TAU); c.fill();
        skull(c, 1.6, -2.8, 2.4, 0.3, 0.5);
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3, cx = Math.cos(a) * 20, cy = -1 + Math.sin(a) * 2.6; kerze(c, cx, cy, 3.4 + (k % 2), 1.4, k === 4 ? "#3a2a2a" : "#e8dcc0"); }
        /* kniender Kultist in roter Robe am Rand */
        c.save(); c.translate(-25, 0);
        c.fillStyle = lg(c, -4, -12, 4, 0, ["#9a2a28", "#5a1414"]); c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-5, -6, -2, -11); c.quadraticCurveTo(0, -13.4, 2.4, -11); c.quadraticCurveTo(5, -6, 5, 0); c.fill();
        c.fillStyle = "#6a1a1a"; c.beginPath(); c.moveTo(-2, -11); c.quadraticCurveTo(1, -16, 4.4, -12); c.quadraticCurveTo(3, -9, 0, -9.4); c.fill(); E(c, 2.4, -11, 1.6, 1.4, "#1a0e0e"); skull(c, 2.6, -11.2, 1.3, 0.5);
        hand(c, 5, -4, 0.2); c.restore();
        break;
      }
      case "ertrunken": {
        c.fillStyle = "rgba(60,70,60,.35)"; c.beginPath(); c.ellipse(0, -0.2, 20, 1.6, 0, 0, TAU); c.fill(); E(c, -6, -0.6, 6, 0.4, "rgba(200,210,190,.2)");
        skelett(c, LIEG, { tunika: [-8, -4.4, 1, -4.4, 2, -0.4, -8, -0.4], tunikaCol: "#3a4a3a", barfuss: true, kiefer: 0.6 }, R);
        for (let k = 0; k < 9; k++) E(c, -10 + R() * 20, -1 - R() * 4, 0.7, 0.5, R() < 0.5 ? "#3a6a3a" : "#d8d0c0");
        c.strokeStyle = "#5a5450"; c.lineWidth = 0.8; for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(13 + k * 1.6, -1, 1, 0.6, 0, 0, TAU); c.stroke(); }
        c.fillStyle = rg(c, 24, -4, 4, ["#6a6668", "#3a3436", "#1a1618"]); c.beginPath(); c.arc(25, -3, 3.2, 0, TAU); c.fill(); E(c, 24, -4.2, 1, 0.6, "rgba(255,255,255,.25)");
        break;
      }
      case "kartenzeichner": {
        shadow(c, 0, 0.5, 24, 2, 0.4);
        for (let k = 0; k < 6; k++) { const a = (R() - 0.5) * 0.6; if (k % 2) karte(c, -20 + k * 7 + R() * 2, -0.4, 6 + R() * 2, 4, a, R); else papier(c, -20 + k * 7, -0.3, 5, 3.6, a, R, 3); }
        /* Schreibtisch aus Brettern auf Kisten */
        kiste(c, 4, -8, 6, 8, "#6a4428", R); kiste(c, 15, -8, 6, 8, "#5a3a22", R);
        c.fillStyle = lg(c, 0, -10, 0, -8, ["#8a6440", "#4a2e1a"]); c.fillRect(2, -9.6, 21, 1.8);
        karte(c, 12, -10.6, 12, 1.6, 0, R);
        /* Kartenzeichner sitzt auf einer Kiste und ist über den Tisch gesunken */
        kiste(c, -10, -6, 7, 6, "#7a5432", R);
        skelett(c, { hip: [-6.6, -6.6], neck: [1.6, -13], head: [4.4, -12.4, 0.9], sh: [1, -12.6], arms: [[[5.6, -10.6], [10, -10.4]], [[3.6, -9.4], [7.6, -10.2]]], legs: [[[-1.8, -7.4], [-1.4, -0.8]], [[-2.6, -6.6], [-3.4, -0.8]]] }, { tunika: [-8, -7.6, -4.6, -13, 2, -14, 1.6, -9.4, -3, -6], tunikaCol: "#4a3a5a", umhang: [-9, -6, -7, -13, -3, -14, -5, -6], umhangCol: "#2e2a2a" }, R);
        c.fillStyle = "#3a2a4a"; c.beginPath(); c.moveTo(2.4, -14.6); c.quadraticCurveTo(4.4, -16.6, 7, -14.6); c.lineTo(6.6, -13.4); c.lineTo(2.6, -13.6); c.fill(); /* Kappe */
        /* Tintenfass umgekippt, Feder, Zirkel, Kartenrolle */
        c.save(); c.translate(20, -10.4); c.rotate(PI / 2); B(c, -1.2, -1, 2.4, 2, "#2a2228"); c.restore(); E(c, 20, -9.8, 3.2, 0.6, "rgba(20,14,24,.85)"); B(c, 22.6, -9.6, 0.5, 2.6, "rgba(20,14,24,.7)");
        Ln(c, "#e8e0d0", 0.4, [14, -10.4, 18, -13.4]); Ln(c, "rgba(230,220,200,.6)", 1, [16, -12, 18, -13.4]);
        Ln(c, "#9e9c9a", 0.4, [7, -10.4, 8.4, -13, 9.6, -10.4]); E(c, 8.4, -13, 0.4, 0.4, "#b8923a");
        c.save(); c.translate(-18, -1.2); c.rotate(-0.1); c.fillStyle = lg(c, 0, -1.2, 0, 1.2, ["#8a5a3a", "#4a2a1a"]); c.fillRect(0, -1.2, 9, 2.4); E(c, 9, 0, 0.6, 1.2, "#3a2414"); E(c, 0, 0, 0.6, 1.2, "#b8923a"); c.restore();
        c.save(); c.translate(26, -1); B(c, -1.6, -5, 3.2, 5, "#3a3032"); P(c, "#2e2628", [-2.2, -5, 0, -7, 2.2, -5]); B(c, -1.2, -4.4, 2.4, 3.4, "rgba(255,200,110,.75)"); c.restore();
        break;
      }
      case "haendler": {
        shadow(c, 0, 0.5, 36, 2.4, 0.4);
        /* umgestürzter Karren: Ladefläche schräg, ein Rad oben */
        c.save(); c.translate(-12, -1); c.rotate(-0.55);
        c.fillStyle = lg(c, 0, -14, 0, 0, ["#8a6440", "#5a3a22", "#3a2414"]); c.fillRect(-18, -14, 34, 13); for (let k = 0; k < 4; k++) Ln(c, "rgba(20,10,4,.5)", 0.35, [-18, -14 + k * 3.3, 16, -14 + k * 3.3]);
        for (const x of [-16, 0, 14]) B(c, x, -14.6, 2, 14, "#4a2e1a");
        c.restore();
        c.save(); c.translate(-30, -14); const wr = 6.4; E(c, 0, 0, wr, wr, "rgba(0,0,0,0)"); c.strokeStyle = "#3a2414"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, wr, 0, TAU); c.stroke(); c.strokeStyle = "#4a4446"; c.lineWidth = 0.6; c.beginPath(); c.arc(0, 0, wr + 0.6, 0, TAU); c.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * PI; Ln(c, "#5a3820", 0.9, [Math.cos(a) * wr, Math.sin(a) * wr, -Math.cos(a) * wr, -Math.sin(a) * wr]); } rivet(c, 0, 0, 1.2); c.restore();
        c.save(); c.translate(4, -2); c.rotate(-0.3); c.strokeStyle = "#3a2414"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 6.4, PI * 1.1, PI * 2.6); c.stroke(); c.restore();
        /* Händler halb darunter */
        skelett(c, { hip: [12, -2], neck: [3, -2.6], head: [0, -2.8, -1.4], sh: [3.6, -2.6], arms: [[[1.4, -6.6], [-3, -8.4]], null], legs: [[[17, -4.6], [21.4, -0.8]], [[17.4, -1.6], [22.6, -1]]], fuss: [0.2, 0] }, { tunika: [2, -5, 12.6, -4.4, 13, -0.4, 2, -0.4], tunikaCol: "#6a4a1a", guertel: true, beutel: 1 }, R);
        c.fillStyle = "#7a2a3a"; c.beginPath(); c.moveTo(-2.4, -3.6); c.quadraticCurveTo(0, -7, 2.4, -4); c.lineTo(1.6, -1.8); c.fill(); /* Mütze */
        /* verstreute Waren: Äpfel, Tonkrüge, Stoffballen, Münzen, Kassenbuch */
        for (let k = 0; k < 7; k++) { const ax = -40 + R() * 28, ay = -1 - R() * 0.4; E(c, ax, ay, 1.3, 1.2, k % 3 ? "#a8302a" : "#b8a030"); E(c, ax - 0.4, ay - 0.4, 0.4, 0.3, "rgba(255,240,200,.5)"); }
        for (let k = 0; k < 5; k++) P(c, "#9a5a3a", [-24 + k * 2.6, 0, -23 + k * 2.6, -1.6 - (k % 2) * 1.4, -21.6 + k * 2.6, 0]);
        c.save(); c.translate(28, -2.4); c.rotate(0.1); c.fillStyle = lg(c, -6, -2.4, 6, 2.4, ["#7a3a6a", "#4a1a3a"]); c.fillRect(-6, -2.4, 12, 4.8); for (let k = -5; k < 6; k += 2) Ln(c, "rgba(0,0,0,.3)", 0.3, [k, -2.4, k + 0.5, 2.4]); E(c, 6, 0, 1, 2.4, "#5a2a4a"); c.restore();
        c.save(); c.translate(36, -1.6); c.rotate(-0.2); c.fillStyle = "#c8a060"; c.fillRect(-5, -1.6, 10, 3.2); c.fillStyle = "#2a6a3a"; c.fillRect(-5, -1, 10, 0.6); c.restore();
        muenzen(c, 30, -0.2, 9, R); muenzen(c, -6, -0.2, 5, R);
        c.save(); c.translate(8, -1.2); c.rotate(-0.05); B(c, -3.6, -1.2, 7.2, 2.4, "#4a2a1a"); B(c, -3.2, -1.5, 6.4, 0.5, "#e8dcc0"); c.restore();
        /* Schild „Waren aller Art“ */
        c.save(); c.translate(42, -9); c.rotate(0.25); B(c, -0.5, 0, 1, 9, "#4a2e1a"); c.fillStyle = lg(c, -6, -5, 6, 0, ["#9a7448", "#6a4a2a"]); c.fillRect(-6, -5.6, 12, 5.2); for (let k = 0; k < 3; k++) B(c, -4.6, -4.6 + k * 1.4, 9 - k * 1.6, 0.5, "rgba(240,230,200,.75)"); c.restore();
        break;
      }
      case "liebesbrief": {
        shadow(c, 0, 0.5, 14, 2, 0.4);
        skelett(c, { hip: [-3, -2.6], neck: [-4.6, -12.6], head: [-3, -16, 0.75], sh: [-4.4, -11.6], arms: [[[-0.4, -8.6], [-2.6, -11.4]], [[-1.4, -7.6], [-3.4, -10.6]]], legs: [[[3.4, -7], [6.4, -0.8]], [[4.4, -6], [8, -0.8]]] }, { tunika: [-7.4, -12.4, -2, -13.4, 0.4, -6, -0.6, -1.6, -6, -1.6], tunikaCol: "#4a3a2a", umhang: [-8, -14, -5, -14.6, -7, 0, -10.4, 0], umhangCol: "#2a2a2a", kiefer: 0.15 }, R);
        papier(c, -1.4, -11.4, 4.6, 5.6, -0.35, R, 4); B(c, -1.6, -10, 0.8, 0.8, "#a83030");
        /* gepresste Rose, Medaillon, abgebrannte Kerze, Band */
        c.save(); c.translate(8, -0.8); c.rotate(-0.15); Ln(c, "#4a5a2a", 0.4, [-4, 0, 3, -0.4]); for (let k = 0; k < 6; k++) E(c, 3.6 + Math.cos(k) * 0.8, -0.6 + Math.sin(k * 2) * 0.6, 0.9, 0.6, k % 2 ? "#7a2a3a" : "#5a1a2a", k); E(c, -1, 0.3, 1.1, 0.4, "#4a5a2a", 0.4); c.restore();
        c.strokeStyle = "#c8a040"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(14, -0.6); c.quadraticCurveTo(12, -3, 10, -1); c.stroke(); E(c, 14.6, -0.8, 1.6, 1.3, "#c8a040"); E(c, 14.6, -0.8, 1.1, 0.9, "#e8d8c0"); E(c, 14.6, -1, 0.5, 0.5, "#8a5a3a");
        kerze(c, -12, 0, 1.6, 1.4); E(c, -12, -0.1, 2.2, 0.6, "rgba(232,220,192,.8)");
        c.strokeStyle = "#a83030"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(18, -0.3); c.bezierCurveTo(20, -2, 21, 0.4, 23, -0.6); c.stroke();
        /* Herz in die Wand geritzt */
        c.strokeStyle = "rgba(230,220,200,.4)"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-9, -22); c.bezierCurveTo(-12, -25, -14, -21, -9, -18); c.bezierCurveTo(-4, -21, -6, -25, -9, -22); c.stroke();
        break;
      }
      case "magier": {
        /* Rußschatten an der Wand mit erhobenen Armen, Brandfleck am Boden */
        c.fillStyle = rg(c, -4, -20, 26, ["rgba(10,8,8,.75)", "rgba(20,14,12,.45)", "rgba(20,14,12,0)"]); c.beginPath(); c.ellipse(-4, -18, 24, 26, 0, 0, TAU); c.fill();
        c.fillStyle = "rgba(6,4,4,.6)"; c.beginPath(); c.moveTo(-8, -2); c.lineTo(-7, -18); c.lineTo(-14, -36); c.lineTo(-12, -37); c.lineTo(-5, -24); c.lineTo(-3, -28); c.quadraticCurveTo(-1, -33, 1, -28); c.lineTo(3, -24); c.lineTo(9, -37); c.lineTo(11, -36); c.lineTo(5, -18); c.lineTo(6, -2); c.fill();
        for (let k = 0; k < 16; k++) { const a = -PI + R() * PI, r = 14 + R() * 16; Ln(c, "rgba(10,6,6,.35)", 0.6, [-1 + Math.cos(a) * 6, -18 + Math.sin(a) * 6, -1 + Math.cos(a) * r, -18 + Math.sin(a) * r]); }
        c.fillStyle = "rgba(10,6,6,.6)"; c.beginPath(); c.ellipse(0, -0.4, 22, 2.2, 0, 0, TAU); c.fill();
        skelett(c, SITZ, { tunika: [-8.4, -13, -1.6, -14, 1.4, -5, 1, -1, -7.4, -1], tunikaCol: "#2a1e2a", kiefer: 0.5, schaedelCol: ["#7a6e60", "#4a4238", "#1e1a16"] }, R);
        /* Spitzhut, angesengt */
        c.save(); c.translate(9, -1); c.rotate(0.5); c.fillStyle = lg(c, -4, -10, 4, 0, ["#4a2a6a", "#2a1a3a"]); c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(-1, -4, 0.6, -10); c.quadraticCurveTo(1, -7, 3, -6.4); c.quadraticCurveTo(2, -3, 5, 0); c.fill(); E(c, 0, 0, 6, 1.1, "#3a2050"); for (let k = 0; k < 3; k++) E(c, -1 + k * 1.6, -3 - k * 1.6, 0.4, 0.4, "#c8a040"); E(c, 3, -6.6, 1, 0.8, "#1a1010"); c.restore();
        /* zerbrochener Stab mit Kristall */
        c.save(); c.translate(-14, -0.8); c.rotate(-0.08); B(c, 0, -0.5, 10, 1, "#4a2e1a"); c.restore(); c.save(); c.translate(-20, -1.6); c.rotate(0.6); B(c, -6, -0.5, 7, 1, "#3a2414"); c.restore();
        P(c, "#a87aff", [-27, -4.6, -25.4, -7.6, -23.6, -4.8, -25.2, -3]); P(c, "#d8b8ff", [-25.4, -7.6, -24.4, -6, -25.2, -4.4]);
        /* Zauberbuch, verbrannte Seiten */
        c.save(); c.translate(16, -1); c.rotate(-0.1); B(c, -5, -1.4, 10, 1.6, "#4a1a1a"); c.fillStyle = "#d8c8a0"; c.beginPath(); c.moveTo(-4.6, -1.4); c.quadraticCurveTo(-2, -3, 0, -1.8); c.quadraticCurveTo(2, -3, 4.6, -1.4); c.lineTo(4.6, -0.8); c.lineTo(-4.6, -0.8); c.fill(); c.fillStyle = "#1a1010"; c.beginPath(); c.moveTo(1, -2.4); c.lineTo(4.6, -1.6); c.lineTo(4.6, -0.8); c.lineTo(2.4, -1); c.fill(); c.restore();
        for (let k = 0; k < 6; k++) papier(c, 20 + R() * 10, -0.3, 2.4, 1.8, R() * 2, R, 1);
        break;
      }
      case "zwerg": {
        shadow(c, 0, 0.5, 16, 2, 0.4);
        /* kurz und stämmig, an die Wand gelehnt */
        const J = { hip: [-3, -2.4], neck: [-4.4, -10.4], head: [-3, -13.8, 0.3], sh: [-4.2, -9.6], arms: [[[0, -6], [3.4, -4.4]], [[-6.6, -5.8], [-7.6, -1]]], legs: [[[1.6, -5.2], [4.6, -0.8]], [[2.6, -2.6], [6.6, -0.8]]] };
        skelett(c, J, { tunika: [-7.6, -11, -1.4, -11.4, 1, -5, 0.4, -1.4, -6.4, -1.4], tunikaCol: "#5a3a1a", guertel: true, beutel: 1, helm: "zwerg", kopf: 3, stiefel: "#3a2414" }, R);
        /* geflochtener Bart mit Ringen */
        c.fillStyle = "#b8643a"; c.beginPath(); c.moveTo(-5, -11.4); c.quadraticCurveTo(-3, -13, -0.6, -11.6); c.quadraticCurveTo(-0.6, -7, -2.4, -4.6); c.quadraticCurveTo(-4.6, -7, -5, -11.4); c.fill();
        for (let k = 0; k < 5; k++) { E(c, -2.6 + Math.sin(k) * 0.3, -10 + k * 1.2, 1, 0.5, k % 2 ? "#a8542a" : "#c8743a"); } for (const y of [-7.6, -5.4]) B(c, -3.6, y, 2.2, 0.7, "#c8a040");
        /* zerbrochene Spitzhacke */
        c.save(); c.translate(10, -1.4); c.rotate(-0.1); B(c, -1, -0.5, 7, 1, "#6a4a28"); P(c, "#c8a870", [6, -0.5, 7, 0, 6, 0.5]); c.restore();
        c.save(); c.translate(-14, -2); c.rotate(0.2); B(c, 0, -0.5, 4, 1, "#6a4a28"); c.fillStyle = lg(c, 0, -3, 0, 3, ["#9e9c98", "#4c4a48"]); c.beginPath(); c.moveTo(3, 0); c.quadraticCurveTo(5, -3.4, 10, -3); c.lineTo(4.6, -1); c.lineTo(4.6, 1); c.lineTo(8.6, 3.4); c.quadraticCurveTo(5, 3.6, 3, 0); c.fill(); c.restore();
        /* Erzbrocken, Edelstein, Humpen, Laterne */
        for (let k = 0; k < 5; k++) { const x = 13 + k * 2.2, y = -1 - (k % 2); P(c, "#4a3a3a", [x - 1.2, y + 1, x - 0.6, y - 1, x + 1, y - 0.8, x + 1.2, y + 1]); B(c, x - 0.2, y - 0.2, 0.5, 0.5, "#e8c060"); }
        P(c, "#c84a6a", [20, -1.4, 21.2, -3, 22.4, -1.4, 21.2, -0.4]);
        c.save(); c.translate(-12, -1); c.rotate(1.3); B(c, -1.6, -3, 3.2, 4, "#8e8c8a"); B(c, -1.6, -3, 3.2, 0.5, "#cccac6"); c.strokeStyle = "#8e8c8a"; c.lineWidth = 0.5; c.beginPath(); c.arc(1.8, -1, 1.2, -1.4, 1.4); c.stroke(); c.restore();
        c.save(); c.translate(-20, -1); B(c, -1.6, -5, 3.2, 5, "#3a3032"); P(c, "#2e2628", [-2.2, -5, 0, -7, 2.2, -5]); B(c, -1.2, -4.4, 2.4, 3.4, "rgba(60,50,40,.9)"); c.restore();
        break;
      }
      case "barde": {
        shadow(c, 0, 0.5, 14, 2, 0.4);
        skelett(c, SITZ, { tunika: [-7.6, -12.4, -2, -13.6, 0.6, -6, -0.4, -1.6, -6, -1.6], tunikaCol: "#6a2a5a", umhang: [-8, -14, -5, -14.6, -7, 0, -10.4, 0], umhangCol: "#2a4a3a", guertel: true, kiefer: 0.45 }, R);
        /* Federhut daneben, mit Münzen darin */
        c.save(); c.translate(13, -0.6); c.fillStyle = "#4a2a4a"; c.beginPath(); c.ellipse(0, 0, 5, 1.4, 0, 0, TAU); c.fill(); c.fillStyle = "#3a1a3a"; c.beginPath(); c.ellipse(0, -0.4, 3.4, 1, 0, 0, TAU); c.fill(); for (let k = 0; k < 3; k++) E(c, -1 + k, -0.6, 0.6, 0.25, "#c8843a"); c.fillStyle = "#d8b040"; c.beginPath(); c.moveTo(3, -0.4); c.quadraticCurveTo(7, -5, 9, -8); c.quadraticCurveTo(7, -4, 4, 0); c.fill(); Ln(c, "#a88020", 0.2, [3.4, -0.6, 8.6, -7.6]); c.restore();
        /* Laute mit gerissenen Saiten */
        c.save(); c.translate(2, -5); c.rotate(-0.9);
        c.fillStyle = lg(c, -5, -4, 5, 4, ["#c8905a", "#8a5a2a", "#5a3a1a"]); c.beginPath(); c.ellipse(0, 0, 5, 4, 0, 0, TAU); c.fill(); E(c, 0.6, 0, 1.3, 1.3, "#2a1a10"); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; E(c, 0.6 + Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0.2, 0.2, "#e8c870"); }
        B(c, 4.6, -0.8, 10, 1.6, "#5a3a1a"); c.save(); c.translate(14.6, 0); c.rotate(0.5); B(c, 0, -1, 3.4, 2, "#4a2a14"); for (let k = 0; k < 3; k++) B(c, 0.6 + k, -1.6, 0.4, 0.6, "#e8dcc0"); c.restore();
        Ln(c, "rgba(240,230,200,.7)", 0.15, [-3, -0.4, 14.6, -0.4]); Ln(c, "rgba(240,230,200,.6)", 0.15, [-3, 0.4, 5, 0.6, 3, 3]); Ln(c, "rgba(240,230,200,.6)", 0.15, [12, 0.2, 9, 2.4]);
        c.restore();
        papier(c, -14, -0.5, 5, 3.6, 0.2, R, 0); c.save(); c.translate(-14, -0.5); c.rotate(0.2); for (let k = 0; k < 3; k++) { B(c, -2, -1.2 + k * 1, 4, 0.15, "rgba(40,30,20,.6)"); E(c, -1.4 + k * 1.3, -1 + k * 0.9, 0.3, 0.25, "#1a1210"); } c.restore();
        break;
      }
      case "mimik": {
        shadow(c, 0, 0.5, 16, 2, 0.45);
        /* Stiefel eines Opfers ragen heraus */
        stiefel(c, -10, -1.4, -0.4, "#4a3020"); stiefel(c, -12, -3.4, -0.9, "#3a2414"); bone(c, -6, -5, -9.4, -2.6, 1);
        const col = "#6a3a22";
        c.fillStyle = lg(c, 0, -10, 0, 0, ["#8a5a32", col, "#3a2012"]); c.fillRect(-8, -9, 16, 9); for (let k = -6; k < 8; k += 3.4) Ln(c, "rgba(30,14,6,.4)", 0.25, [k, -9, k, 0]);
        for (const x of [-6.5, 5.5]) { B(c, x, -9, 1, 9, "#4a4446"); rivet(c, x + 0.5, -7, 0.35); rivet(c, x + 0.5, -2, 0.35); }
        /* Maul: Zähne, Zunge */
        B(c, -7.6, -10.4, 15.2, 1.6, "#2a0a0a"); for (let k = 0; k < 8; k++) { P(c, "#efe6d0", [-7.4 + k * 1.9, -10.4, -6.6 + k * 1.9, -8.6, -5.8 + k * 1.9, -10.4]); P(c, "#efe6d0", [-7 + k * 1.9, -10.6, -6.2 + k * 1.9, -12.4, -5.4 + k * 1.9, -10.6]); }
        c.fillStyle = lg(c, 0, -15, 0, -10, ["#9a6a3a", col]); c.beginPath(); c.moveTo(-8.4, -10.6); c.lineTo(-8, -14); c.quadraticCurveTo(0, -18, 8, -14); c.lineTo(8.4, -10.6); c.closePath(); c.fill(); B(c, -1.6, -11.4, 3.2, 2.4, "#b8923a");
        E(c, -3, -14.4, 1.2, 0.9, "#e8d84a"); E(c, -3, -14.4, 0.4, 0.8, "#1a1010"); /* ein Auge im Deckel */
        break;
      }
    }
  }
  const SPR = new Map();
  function sprite(s) {
    const res = Math.max(2, Math.min(4, Math.ceil((Z.gfx && Z.gfx.scale) || 2)));
    let o = SPR.get(s); if (o && o.res === res) return o;
    const b = BOX[s.kind] || DEFBOX, w = b[2] - b[0], h = b[3] - b[1];
    const cv = document.createElement("canvas"); cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res);
    const c = cv.getContext("2d"); c.scale(res, res); c.translate(-b[0], -b[1]);
    try { if (s.kind !== "kokon") szene(c, s, Z.Rng(((s.seed * 1000) | 0) >>> 0)); } catch (e) { console.error(s.kind, e); }
    o = { cv, l: b[0], t: b[1], w, h, res }; SPR.set(s, o); return o;
  }

  /* ======================= Zeichnen ======================= */
  /* aufgescheuchte Fliegen kommen nach ein paar Sekunden zurück */
  const scat = s => s.scat && performance.now() - s.scat < 4000;
  const flamme = (x, y, sz, ph, k) => { if (Z.ausFlamme) Z.ausFlamme(x, y, sz, ph, k); };
  const schein = (x, y, r, a, k) => { if (Z.ausSchein) Z.ausSchein(x, y, r, a, k); };
  const licht = (x, y, r, a) => { if (Z.ausLicht) Z.ausLicht(x, y, r, a); };
  function draw(c, t) {
    const cam = Z.cam;
    for (const s of list) {
      const x = s.x * T + 8, gy = (s.y + 1) * T;
      if (x < cam.x - 70 || x > cam.x + cam.w + 70 || gy < cam.y - 70 || gy > cam.y + cam.h + 110) continue;
      const f = s.flip || 1, sp = sprite(s), X = lx => x + lx * f;
      if (s.kind !== "kokon") { c.save(); c.translate(x, gy); c.scale(f, 1); c.drawImage(sp.cv, sp.l, sp.t, sp.w, sp.h); c.restore(); }
      switch (s.kind) {
        case "abenteurer": { const u = (t * 0.4 + s.seed) % 1; c.fillStyle = "rgba(120,110,110," + 0.25 * (1 - u) + ")"; c.beginPath(); c.arc(X(17) + Math.sin(u * 5) * 2, gy - 2 - u * 16, 1 + u * 3, 0, TAU); c.fill(); if (!scat(s)) fliegen(c, X(-3), gy - 14, t, 2, s.seed); break; }
        case "lager": {
          const e = 0.35 + 0.3 * Math.sin(t * 2 + s.seed); schein(X(4), gy - 1, 10, e * 0.6, "e");
          for (let k = 0; k < 5; k++) E(c, X(1 + k * 1.6), gy - 1 - (k % 2) * 0.6, 0.6, 0.4, "rgba(255," + (90 + 60 * Math.sin(t * 3 + k) | 0) + ",30," + (0.5 + 0.4 * Math.sin(t * 2.3 + k * 1.7)) + ")");
          rauch(c, X(4), gy - 3, t, s.seed, 3); break;
        }
        case "ritual": {
          c.save(); c.globalAlpha = 0.25 + 0.2 * Math.sin(t * 1.5 + s.seed); c.strokeStyle = "#e8b0ff"; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x, gy - 0.6, 22, 3.2, 0, 0, TAU); c.stroke(); c.restore();
          for (let k = 0; k < 4; k++) { const a = k / 5 * TAU + 0.3; flamme(x + Math.cos(a) * 20 * f, gy - 1 + Math.sin(a) * 2.6 - 3.8 - (k % 2), 0.55, k * 2 + s.seed); }
          schein(x, gy - 3, 22, 0.25 + 0.1 * Math.sin(t * 3), "p"); licht(x, gy - 6, 50, 0.5); break;
        }
        case "kokon": {
          const wb = s.wob ? Math.max(0, 1 - (performance.now() - s.wob) / 1500) : 0;
          const hy = gy - 46, sw = Math.sin(t * 0.8 + s.seed) * 2 + Math.sin(t * 9) * 5 * wb, tw = Math.sin(t * 4.3 + s.seed) > 0.96 ? Math.sin(t * 40) * 0.08 : 0;
          c.strokeStyle = "rgba(230,224,236,.6)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, hy - 44); c.lineTo(x + sw, hy); c.stroke();
          for (let k = 0; k < 8; k++) { c.strokeStyle = "rgba(230,224,236,.22)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(x + sw, hy); c.lineTo(x + Math.cos(k) * 30, hy - 30 + Math.sin(k * 2) * 10); c.stroke(); }
          c.save(); c.translate(x + sw, hy + 13); c.rotate(sw * 0.03 + tw);
          c.fillStyle = "#cfc6d6"; c.beginPath(); c.ellipse(0, 0, 6.4, 13.6, 0, 0, TAU); c.fill(); E(c, -2, -3, 2.4, 8, "rgba(255,255,255,.25)");
          c.strokeStyle = "rgba(150,140,165,.85)"; c.lineWidth = 0.35; for (let k = -11; k < 12; k += 2.2) { c.beginPath(); c.moveTo(-6.2, k); c.quadraticCurveTo(0, k + 3, 6.2, k - 1); c.stroke(); }
          B(c, -1.6, 12.4, 3.2, 4, "#3a2a1a"); B(c, -2.2, 15.4, 4.4, 1.6, "#2a1a10"); E(c, 4, 4, 1, 1.4, "#c8b8a0"); for (let k = 0; k < 3; k++) Ln(c, "#c8b8a0", 0.3, [4.6, 5, 5.6 + k * 0.4, 7]);
          c.restore();
          c.fillStyle = "rgba(230,224,236,.3)"; c.beginPath(); c.ellipse(x, gy - 0.4, 10, 1.4, 0, 0, TAU); c.fill(); for (let k = 0; k < 3; k++) { const bx = x - 6 + k * 6; Ln(c, BONE, 0.8, [bx - 2, gy - 0.8, bx + 2, gy - 1.2]); }
          break;
        }
        case "ertrunken": {
          c.lineCap = "round"; for (let k = 0; k < 4; k++) { const bx = X(-8 + k * 5); c.strokeStyle = k % 2 ? "#3a6a3a" : "#2e5a34"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx, gy); c.quadraticCurveTo(bx + Math.sin(t * 1.4 + k) * 3, gy - 6, bx + Math.sin(t + k) * 2, gy - 10 - k); c.stroke(); } c.lineCap = "butt";
          /* eine kleine Krabbe krabbelt aus den Rippen */
          const u = (t * 0.12 + s.seed) % 1; if (u < 0.6) { const cx = X(-4 + u * 30), cy = gy - 1.2; for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) Ln(c, "#a8402a", 0.3, [cx + sd, cy, cx + sd * (2 + k * 0.5), cy + 1 + Math.sin(t * 30 + k) * 0.3]); E(c, cx, cy, 1.6, 0.9, "#c84a2a"); E(c, cx - 1.8, cy - 0.8, 0.6, 0.4, "#c84a2a"); E(c, cx + 1.8, cy - 0.8, 0.6, 0.4, "#c84a2a"); }
          break;
        }
        case "kartenzeichner": { const u = Math.sin(t * 1.3 + s.seed) * 0.5 + Math.sin(t * 3.1) * 0.2; c.save(); c.translate(X(-8), gy - 0.6); c.rotate(u * 0.25 * f); c.fillStyle = "#e8dcc0"; c.beginPath(); c.moveTo(0, 0); c.lineTo(4 * f, -0.4 - Math.max(0, u) * 2); c.lineTo(4.4 * f, 0.4); c.closePath(); c.fill(); c.restore(); flamme(X(26), gy - 2.6, 0.4, s.seed); licht(X(26), gy - 4, 30, 0.35); break; }
        case "haendler": if (!scat(s)) fliegen(c, X(-30), gy - 4, t, 3, s.seed); break;
        case "liebesbrief": { const g = 0.5 + 0.5 * Math.sin(t * 0.9 + s.seed); schein(X(14.6), gy - 1, 3, 0.2 * g, "w"); break; }
        case "magier": {
          const g = 0.5 + 0.5 * Math.sin(t * 2.2 + s.seed); schein(X(-25.2), gy - 5, 8, 0.35 * g + 0.1, "p");
          rauch(c, X(9 + 3), gy - 7, t, s.seed, 3, "90,80,90");
          for (let k = 0; k < 4; k++) { const u = (t * 0.3 + k * 0.25 + s.seed) % 1; E(c, X(-14 + k * 8 + Math.sin(u * 8 + k) * 2), gy - 1 - u * 14, 0.35, 0.35, "rgba(255," + (120 + k * 20) + ",50," + (1 - u) * 0.8 + ")"); }
          break;
        }
        case "zwerg": { const tw = Math.max(0, Math.sin(t * 2.4 + s.seed)) ** 8; if (tw > 0.05) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,200,220," + tw + ")"; c.fillRect(X(21.2) - 0.2, gy - 4.6, 0.4, 2.6); c.fillRect(X(21.2) - 1.3, gy - 3.5, 2.6, 0.4); c.restore(); } break; }
        case "barde": { const k = Math.sin(t * 0.6 + s.seed) > 0.85; if (k) { c.save(); c.globalAlpha = 0.6; c.translate(X(2), gy - 5); c.rotate(-0.9 * f); Ln(c, "#fff0c0", 0.2, [-3 * f, -0.4 + Math.sin(t * 60) * 0.3, 14.6 * f, -0.4]); c.restore(); } break; }
        case "mimik": {
          const sn = s.snap ? (performance.now() - s.snap) / 1000 : 9; if (sn < 0.5) { const k = Math.sin(sn / 0.5 * PI); c.fillStyle = "rgba(20,10,8,.8)"; c.beginPath(); c.ellipse(X(0), gy - 9, 9, 2 + k * 3, 0, 0, TAU); c.fill(); for (let q = -3; q <= 3; q++) { c.fillStyle = "#e8e0d0"; c.beginPath(); c.moveTo(X(q * 2.4 - 0.8), gy - 9 - k * 2.6); c.lineTo(X(q * 2.4 + 0.8), gy - 9 - k * 2.6); c.lineTo(X(q * 2.4), gy - 9 - k * 0.6); c.fill(); } }
          const br = Math.sin(t * 1.3 + s.seed); c.fillStyle = "#a83a4a"; c.beginPath(); c.moveTo(X(-2), gy - 9.6); c.quadraticCurveTo(X(4 + br), gy - 6 + br * 0.6, X(7 + br * 1.4), gy - 2); c.quadraticCurveTo(X(4), gy - 3.4, X(0), gy - 8.4); c.fill();
          if (Math.sin(t * 0.7 + s.seed) > 0.97) { E(c, X(-3), gy - 14.4, 1.3, 0.25, "#6a3a22"); } break;
        }
      }
    }
  }
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) { if (dwp0) dwp0.apply(this, arguments); if (Z.level === lvRef) draw(c, t); };

  /* ======================= Reaktionen auf Treffer =======================
     Die Szenen bleiben stehen (sie erzählen etwas und tragen Beute), aber sie reagieren: Knochen klappern und
     verlieren Splitter, Pergamente und Briefe flattern auf, die Glut des Lagers stiebt, die Laute klingt nach,
     die Truhe mit Zähnen schnappt zu, Fliegen stieben auseinander. Rein dekorativ; Stufe 0: nur der Klang. */
  const rnd = Math.random;
  const PAPER = ["#efe4c8", "#d8c8a0", "#e8dcc0"], BONEC = [BONE, BONE2, "#b8b098"];
  function reactHit(sp, hx, hy, dir, strong) {
    const now = performance.now(); if ((sp.rcd || 0) > now) return; sp.rcd = now + 450; sp.scat = now;
    const FX = Z.fx, rich = !Z.gq || Z.gq.level >= 1, x = sp.x * T + 8, gy = (sp.y + 1) * T;
    const p = (o, n) => { if (FX && rich) for (let i = 0; i < n; i++) FX.p(Object.assign({ x: hx + (rnd() - 0.5) * 12, y: hy - rnd() * 6, vx: dir * (20 + rnd() * 60) + (rnd() - 0.5) * 40, vy: -40 - rnd() * 80, life: 0.8 + rnd() * 0.6, vr: (rnd() - 0.5) * 12 }, typeof o === "function" ? o() : o)); };
    switch (sp.kind) {
      case "kartenzeichner": case "liebesbrief":
        A.play("scroll", { vol: 0.3, x: hx }); p(() => ({ size: 2.2, col: PAPER[(rnd() * 3) | 0], kind: "leaf", g: 70, drag: 0.92, life: 2 + rnd() }), sp.kind === "kartenzeichner" ? 6 : 3); break;
      case "lager":
        A.play("fire", { vol: 0.2, rate: 1.5, x: hx }); p(() => ({ x: x + 4 * (sp.flip || 1), y: gy - 2, size: 1, col: rnd() < 0.5 ? "#ffb060" : "#ff7a30", kind: "spark", add: true, g: 200, vy: -60 - rnd() * 90 }), 10); p({ size: 4, col: "rgba(120,110,110,.4)", kind: "smoke", g: -20, drag: 0.94 }, 3); break;
      case "barde": A.play("bell", { vol: 0.14, rate: 2.3 + rnd() * 0.3, x: hx }); p({ size: 1.2, col: "#c8a870", kind: "shard", g: 600 }, 3); break;
      case "mimik": A.play("bite", { vol: 0.35, x: hx }); sp.snap = now; p({ size: 1.4, col: "#7a5432", kind: "shard", g: 700 }, 4); break;
      case "kokon": A.play("slime", { vol: 0.2, x: hx }); sp.wob = now; break;
      case "ertrunken": A.play("splash", { vol: 0.2, rate: 1.3, x: hx }); p({ size: 1, col: "rgba(150,148,128,.7)", kind: "dot", g: 600 }, 6); break;
      default: A.play("hitBone", { vol: strong ? 0.35 : 0.22, x: hx }); p(() => ({ size: 1.1, col: BONEC[(rnd() * 3) | 0], kind: "shard", g: 700 }), strong ? 6 : 3); if (FX && rich) p({ size: 3, col: "rgba(150,138,124,.45)", kind: "smoke", g: -15, drag: 0.93, vy: -15 }, 2);
    }
  }
  function spurRect(sp) { const b = BOX[sp.kind] || DEFBOX, x = sp.x * T + 8, gy = (sp.y + 1) * T, f = sp.flip || 1; const x0 = f > 0 ? b[0] : -b[2], x1 = f > 0 ? b[2] : -b[0]; return { x: x + x0 + 6, y: gy + b[1] + 6, w: x1 - x0 - 12, h: b[3] - b[1] - 6 }; }
  function hitSpuren(r, dir, strong) {
    if (!r || Z.level !== lvRef) return;
    for (const sp of list) { const q = spurRect(sp); if (r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y) reactHit(sp, Math.max(q.x, Math.min(q.x + q.w, r.x + r.w / 2)), Math.max(q.y, Math.min(q.y + q.h, r.y + r.h / 2)), dir || 1, strong); }
  }
  const hp0 = Z.hitProps;
  Z.hitProps = function (r, dmg, act) { try { hitSpuren(r, act && Z.player ? Z.player.face : 0, !act); } catch (e) { console.error(e); } return hp0 ? hp0.apply(this, arguments) : undefined; };
  const ex0 = Z.explode;
  Z.explode = function (x, y, r, dmg, owner) { const res = ex0.apply(this, arguments); try { if (owner !== "p") { const R = r || 40; hitSpuren({ x: x - R, y: y - R, w: R * 2, h: R * 2 }, 0, true); } } catch (e) { console.error(e); } return res; };
  Z.spuren = () => list;
  /* Prüfhilfe: alle Arten nebeneinander */
  Z._spuren = { NOTES, szene, sprite, draw: (c, kind, t, extra) => { const s = Object.assign({ kind, x: 0, y: 0, seed: 7, flip: 1, wall: -1, trap: "p", note: NOTES[kind][0] }, extra || {}); const keep = list; list = [s]; const cam = Z.cam, cx = cam.x, cy = cam.y; cam.x = -200; cam.y = -200; draw(c, t || 0); cam.x = cx; cam.y = cy; list = keep; } };
})();
