/* Ezekiel – The Destroyer · Abenteuer
   Pakte (Flüche gegen Belohnung), spielbare Gefährten, Umhänge, Erfolge mit Belohnungen,
   Raum-Ereignisse (Goldgoblin, Schrein, Barradins Wette, Wunschbrunnen, Gefangener),
   Runen-Fragmente in Geheimräumen und das wahre, vierte Ende im Herz der Fäden. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const { limb, circ, poly, ell, glow } = Z.draw;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const M = () => Z.meta;
  const inp = Z.input;
  function metaInit() { const m = M(); m.ach = m.ach || {}; m.runes = m.runes || {}; m.heroes = m.heroes || { Z: 1 }; m.capes = m.capes || { rot: 1 }; m.cape = m.cape || "rot"; m.hero = m.hero || "Z"; m.pactSel = m.pactSel || []; m.deaths = m.deaths || 0; m.bonus = m.bonus || {}; m.totalKills = m.totalKills || 0; m.totalGold = m.totalGold || 0; }
  metaInit();

  /* ======================= PAKTE ======================= */
  /* Startausrüstung: immer zwei schlichte Waffen, nie mit bloßen Fäusten los */
  const KITS = {
    sb: { n: ["Schwert & Bogen", "Sword & bow"], d: ["Kurzschwert für die Nähe, Jagdbogen für die Ferne.", "Shortsword up close, hunting bow at range."], a1: "kurzschwert", a2: "jagdbogen" },
    ss: { n: ["Schwert & Schild", "Sword & shield"], d: ["Zuschlagen und parieren – der sichere Weg.", "Strike and parry – the safe way."], a1: "kurzschwert", a2: "holzschild" },
    sm: { n: ["Schwert & Wurfmesser", "Sword & knives"], d: ["Zuschlagen und Messer werfen – die Messer markieren mit einem Faden, das Schwert vollstreckt.", "Strike and throw knives – the knives mark with a thread, the sword executes."], a1: "kurzschwert", a2: "wurfmesser" },
    bs: { n: ["Bogen & Schild", "Bow & shield"], d: ["Für Geübte: Abstand halten, Geschosse zurückwerfen – keine Nahkampfwaffe.", "For the skilled: keep your distance, deflect projectiles – no melee weapon."], a1: "jagdbogen", a2: "holzschild" }
  };
  Z.KITS = KITS;
  const PACTS = {
    glas: { n: ["Glasknochen", "Glass Bones"], d: ["35 % weniger Leben.", "35% less health."] },
    durst: { n: ["Ewiger Durst", "Endless Thirst"], d: ["Keine Heiltränke.", "No healing potions."] },
    raserei: { n: ["Raserei", "Frenzy"], d: ["Gegner sind 30 % schneller.", "Enemies are 30% faster."] },
    blutzoll: { n: ["Blutzoll", "Blood Toll"], d: ["Gegner treffen 50 % härter.", "Enemies hit 50% harder."] },
    elite: { n: ["Elitenflut", "Elite Flood"], d: ["Jeder vierte Gegner ist ein Elite-Gegner.", "Every fourth enemy is an elite."] },
    finster: { n: ["Finsternis", "Darkness"], d: ["Die Hallen sind deutlich dunkler.", "The halls are much darker."] },
    ungeduld: { n: ["Ungeduld", "Impatience"], d: ["Fähigkeiten laden 50 % langsamer.", "Skills recharge 50% slower."] },
    fallen: { n: ["Fallensteller", "Trapper"], d: ["Doppelt so viele Fallen.", "Twice as many traps."] }
  };
  Z.PACTS = PACTS;
  const pact = id => !!(Z.run && Z.run.pacts && Z.run.pacts.includes(id));
  /* W13 R16: Gebietsvariante „Fallengänge“ nutzt die Fallen-Regel des Pakts (welt.js trapDens) – nur für dieses Gebiet */
  Z.hasPact = pact;
  Z.fallenFaktor = () => (varAktiv("fallen") ? VARIANTEN.fallen.faktor : 1); /* welt.js sprinkleTraps */
  const npacts = () => (Z.run && Z.run.pacts ? Z.run.pacts.length : 0);
  /* ======================= GEBIETSVARIANTEN (W13 R16) =======================
     Selten (Vorschlag 18 % je Gebiet ab Stufe 1, höchstens 2 je Lauf, nie Torhof/Arena) bekommt ein Gebiet eine Variante mit eigener Regel,
     Gefahr und besserer Beute (Beute wie ein Pakt mehr). Angekündigt beim Betreten. Werte als Vorschlag für Balance. */
  const VARIANTEN = {
    fallen: { n: ["Fallengänge", "Trapped Halls"], d: ["Doppelt so viele Fallen – und bessere Beute.", "Twice as many traps – and better loot."], ico: "⚠", faktor: 4 }, /* R17: Faktor auf die Fallendichte; ergibt ca. +80 % Fallen (Raumplätze begrenzen) */
    brut: { n: ["Unruhige Brut", "Restless Brood"], d: ["Jeder siebte Gegner ist ein Elite-Gegner – und bessere Beute.", "One in seven enemies is an elite – and better loot."], ico: "☠", elite: 0.15 },
    finster: { n: ["Finstere Tiefe", "Lightless Depths"], d: ["Kaum Licht – aber die Gegner sehen dich auch schlechter. Bessere Beute.", "Barely any light – but enemies see you worse, too. Better loot."], ico: "☾", bereit: () => !!Z.dunkelSanft }, /* nur mit sanfter Abdunkelung der Grafik (Z.dunkelSanft) – der Boss-Dunkelmodus ist für ein ganzes Gebiet zu finster */
    einsturz: { n: ["Einsturzgefahr", "Cave-in"], d: ["Immer wieder bricht die Decke – achte auf rieselnden Staub. Bessere Beute.", "The ceiling keeps caving in – watch for trickling dust. Better loot."], ico: "▼", takt: [4, 7], warn: 1.1, dmg: 0.08, ziel: 0.5 /* W9 R14: 6–10 s → 4–7 s; Anteil direkt auf die (vorausberechnete) Figur – vorher 0–1 Treffer in 120 s */ },
    gold: { n: ["Goldader", "Gold Vein"], d: ["+60 % Gold, ein Goldgoblin treibt sich herum – aber Gegner treffen 15 % härter.", "+60% gold, a gold goblin roams about – but enemies hit 15% harder."], ico: "●", gold: 0.6, dmg: 1.15 }
  };
  const VAR = { chance: 0.18, max: 2 };
  Z.VARIANTEN = VARIANTEN; Z.VARIANTE_OPT = VAR;
  function varAktiv(k) { const v = Z.run && Z.run._var; if (!v || v.id !== k) return false; return Z.run._varLaden || (Z.level && Z.level.id === v.area); }
  Z.gebietVariante = () => { const v = Z.run && Z.run._var; return v && Z.level && Z.level.id === v.area ? Object.assign({ id: v.id }, VARIANTEN[v.id]) : null; };
  function varWahl(id) {
    const run = Z.run; if (!run || !id || !Z.BIOMES || !Z.BIOMES[id] || id === "torhof" || (Z.BIOMES[id].tier || 0) < 1) { if (run) run._varLaden = false; return; }
    if (run._var && run._var.area === id) { run._varLaden = true; return; } /* gleiches Gebiet erneut (z. B. Test) */
    run._var = null; run._varLaden = false;
    const erzwungen = Z.varianteErzwingen;
    if (erzwungen || ((run._varN || 0) < VAR.max && Math.random() < VAR.chance)) {
      const k = erzwungen && VARIANTEN[erzwungen] ? erzwungen : Z.R.pick(Object.keys(VARIANTEN).filter(q => !VARIANTEN[q].bereit || VARIANTEN[q].bereit()));
      run._var = { id: k, area: id }; run._varN = (run._varN || 0) + 1; run._varLaden = true;
    }
  }
  /* Finstere Tiefe: Dunkel-Modus der Beleuchtung (bild.js: Z.darkness > 0, kleiner Lichtkreis; gegner.js: Gegner sehen schlechter).
     Einsturzgefahr: in der Nähe der Figur bricht alle 6–10 s ein Brocken aus der Decke – 1,1 s vorher rieselt Staub, am Boden ein Schatten. */
  let brocken = [], einsturzT = 5;
  function varTick(dt) {
    const v = Z.gebietVariante(), P = Z.player; if (!v || !P || !Z.level) { brocken.length = 0; return; }
    if (v.id === "finster") { if (Z.dunkelSanft) Z.dunkelSanft(0.6, dt); else Z.darkness = Math.max(Z.darkness || 0, 0.1); }
    if (v.id !== "einsturz" || P.dead) return;
    const lv = Z.level, solid = (x, y) => { const g = lv.get(x, y); return g === 1 || g === 7; };
    if ((einsturzT -= dt) <= 0 && !(Z.boss && !Z.bossDefeated) && !(Z.ui && Z.ui.modalOpen)) {
      einsturzT = VARIANTEN.einsturz.takt[0] + Math.random() * (VARIANTEN.einsturz.takt[1] - VARIANTEN.einsturz.takt[0]);
      for (let versuch = 0; versuch < 10; versuch++) { /* mehrere Stellen probieren: hohe Hallen und Wände neben der Figur */
        const px = P.x + P.w / 2 + (versuch === 0 && Math.random() < (VARIANTEN.einsturz.ziel || 0) ? (Math.random() - 0.5) * 12 : (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 80)) + P.vx * 0.6, tx = Math.floor(px / T), fy0 = Math.floor((P.y + P.h - 2) / T);
        let cy = -1; for (let y = fy0; y > fy0 - 16 && y > 0; y--) { if (solid(tx, y)) break; if (solid(tx, y - 1)) { cy = y; break; } }
        if (cy <= 0) continue;
        let fy = cy; while (fy < cy + 16 && !solid(tx, fy + 1) && lv.get(tx, fy + 1) !== 2) fy++;
        if (fy - cy >= 3 && (solid(tx, fy + 1) || lv.get(tx, fy + 1) === 2)) { brocken.push({ x: tx * T + 8, y0: cy * T, yF: (fy + 1) * T, y: cy * T, t: 0, vy: 0, fall: false }); break; }
      }
    }
    for (let i = brocken.length - 1; i >= 0; i--) {
      const b = brocken[i]; b.t += dt;
      if (!b.fall) { if (Math.random() < dt * 18) FX.p({ x: b.x + (Math.random() - 0.5) * 12, y: b.y0 + 2, vx: 0, vy: 40 + Math.random() * 40, life: 0.8, size: 1.3, col: "#9a8a7a", kind: "smoke", g: 200 }); if (b.t >= VARIANTEN.einsturz.warn) { b.fall = true; A.play("rock", { vol: 0.5, rate: 0.8, x: b.x }); } continue; }
      b.vy = Math.min(700, b.vy + 1600 * dt); b.y += b.vy * dt;
      if (b.y + 10 >= b.yF) {
        brocken.splice(i, 1); FX.addShake && FX.addShake(3); A.play("hitHeavy", { vol: 0.45, x: b.x });
        FX.burst(b.x, b.yF - 4, 14, { col: [Z.tileCol || "#6a5a50", "#3a3030"], sp: 140, life: 0.6, size: 3, kind: "shard", g: 700 });
        const r = { x: b.x - 14, y: b.yF - 30, w: 28, h: 30 };
        if (!P.dead && U.overlap(r, P) && !(P.iframe > 0)) Z.hurtPlayer(Math.round(P.hpMax * VARIANTEN.einsturz.dmg), { x: b.x, kb: 120, hazard: true });
        for (const e of Z.enemies) if (!e.dead && !e.def.boss && U.overlap(r, e)) Z.hitEnemy(e, Math.round(e.hpMax * 0.35), { src: "trap", kb: 100, kbUp: 120 });
      }
    }
  }
  Z.einsturzTest = () => { einsturzT = 0; }; Z.brockenN = () => brocken.length; Z.brockenListe = () => brocken;
  function drawBrocken(c) {
    for (const b of brocken) {
      if (!b.fall) { const a = Math.min(1, b.t / VARIANTEN.einsturz.warn); c.fillStyle = "rgba(0,0,0," + (0.15 + 0.35 * a).toFixed(2) + ")"; c.beginPath(); c.ellipse(b.x, b.yF - 1, 6 + 8 * a, 2.2, 0, 0, 6.283); c.fill(); continue; }
      c.fillStyle = "#5a4e48"; c.beginPath(); c.moveTo(b.x - 8, b.y); c.lineTo(b.x - 3, b.y - 9); c.lineTo(b.x + 7, b.y - 6); c.lineTo(b.x + 8, b.y + 4); c.lineTo(b.x - 2, b.y + 8); c.closePath(); c.fill();
      c.fillStyle = "#7a6e66"; c.fillRect(b.x - 3, b.y - 5, 5, 3);
    }
  }
  function varAnsage() { brocken.length = 0; einsturzT = 5;
    const run = Z.run; if (!run) return; run._varLaden = false;
    const v = Z.gebietVariante(); if (!v) return;
    setTimeout(() => { if (Z.gebietVariante() && Z.ui && Z.ui.notify) Z.ui.notify('<span class="var-ico-m var-' + v.id + '">' + v.ico + "</span> <b>" + esc(L(v.n)) + "</b><br><small>" + esc(L(v.d)) + "</small>", { prio: 1, art: "gefahr", dauer: 5200, key: "variante" }); }, 3400);
  }

  /* ======================= HELDEN & UMHÄNGE ======================= */
  const HEROES = {
    Z: { n: ["Ezekiel", "Ezekiel"], d: ["Der Zerstörer. Ausgewogen, Darkin-Blut, nimmt nur mit, was am Ständer liegt.", "The Destroyer. Balanced, Darkin blood, takes only what lies on the rack."] },
    G: { n: ["Friedrich", "Friedrich"], d: ["Waldläufer: startet mit Bogen, Dreifachsprung, Pfeile +20 % Schaden, 10 % weniger Leben.", "Ranger: starts with a bow, triple jump, arrows +20% damage, 10% less health."], unlock: ["Freischalten: ersten Boss oder Wächter besiegen.", "Unlock: defeat your first boss or warden."] },
    B: { n: ["Barradin", "Barradin"], d: ["Barde: startet mit dem Spottlied, alle 12 s Inspiration (+40 % Schaden für 4 s), +50 % Gold.", "Bard: starts with the mocking song, inspiration every 12 s (+40% damage for 4 s), +50% gold."], unlock: ["Freischalten: 10 Paraden in einem Durchgang.", "Unlock: 10 parries in one run."] },
    E: { n: ["Echo", "Echo"], d: ["Druidin: startet mit Echos Blitz, gleitet mit gehaltenem Sprung, jede Münze heilt.", "Druid: starts with Echo's lightning, glides while holding jump, every coin heals."], unlock: ["Freischalten: 1.000 Gold in einem Durchgang.", "Unlock: 1,000 gold in one run."] }
  };
  const CAPES = {
    rot: { n: ["Darkin-Rot", "Darkin Red"], c: ["#8a1414", "#4a0a0c"] },
    rost: { n: ["Rost", "Rust"], c: ["#8a4a1e", "#4a240c"] },
    karte: { n: ["Kartenzeichnerin", "Cartographer"], c: ["#c8a060", "#5a3a1a"] },
    rune: { n: ["Runenwacht", "Rune Watch"], c: ["#c03a5a", "#4a0e1e"] },
    kundschaft: { n: ["Kundschafter", "Scout"], c: ["#6a5a3a", "#2a2216"] },
    pergament: { n: ["Pergament", "Parchment"], c: ["#d8c8a0", "#7a6a48"] },
    nacht: { n: ["Leise Nacht", "Quiet Night"], c: ["#3a2a3a", "#120a12"] },
    moos: { n: ["Moos", "Moss"], c: ["#3a6a2a", "#1a3a14"] },
    gold: { n: ["Gold", "Gold"], c: ["#c8902a", "#6a4a10"] },
    weiss: { n: ["Federweiß", "Feather White"], c: ["#e8e0d8", "#9a908a"] },
    glut: { n: ["Glut", "Ember"], c: ["#ff6a1a", "#7a1a0a"] },
    schatten: { n: ["Schatten", "Shadow"], c: ["#4a2a5a", "#1a0e22"] },
    sturm: { n: ["Sturm", "Storm"], c: ["#6a6a62", "#2a2a26"] },
    zwilling: { n: ["Zwillingsfaden", "Twin Thread"], c: ["#c84a8a", "#4a1a3a"] },
    blut: { n: ["Blutpakt", "Blood Pact"], c: ["#5a0a0a", "#1a0204"] },
    ruhm: { n: ["Ruhm", "Glory"], c: ["#e5b454", "#8a1414"] },
    faden: { n: ["Dreifaden", "Three Threads"], c: ["#d8d0e8", "#5a4a6a"] },
    weberin: { n: ["Netz der Weberin", "Weaver's Web"], c: ["#2a1a2a", "#c03a5a"] },
    zorn: { n: ["Zorn", "Wrath"], c: ["#ff2a3a", "#3a0408"] }
  };
  function applyCape() { const c = CAPES[M().cape] || CAPES.rot; Z.capeCol = c.c; }
  applyCape();

  /* ======================= ERFOLGE ======================= */
  const S = () => Z.stats || {};
  const ACH = [
    { id: "erstesblut", n: ["Erstes Blut", "First Blood"], d: ["Einen Gegner besiegen.", "Defeat an enemy."], ok: () => (S().kills || 0) >= 1, r: { cape: "rost" } },
    { id: "hundert", n: ["Hundert", "Hundred"], d: ["100 Gegner in einem Durchgang.", "100 enemies in one run."], ok: () => (S().kills || 0) >= 100, r: { cape: "moos" } },
    { id: "parade", n: ["Eiserne Hand", "Iron Hand"], d: ["10 Paraden in einem Durchgang.", "10 parries in one run."], ok: () => (S().parries || 0) >= 10, r: { hero: "B" } },
    { id: "ausweichen", n: ["Unberührbar", "Untouchable"], d: ["20 perfekte Ausweichrollen in einem Durchgang.", "20 perfect dodges in one run."], ok: () => (S().dodges || 0) >= 20, r: { cape: "gold" } },
    { id: "boss", n: ["Wächterbrecher", "Wardenbreaker"], d: ["Einen Boss oder Wächter besiegen.", "Defeat a boss or warden."], ok: () => (S().bosses || 0) >= 1, r: { hero: "G" } },
    { id: "gold", n: ["Echos Liebling", "Echo's Darling"], d: ["1.000 Gold in einem Durchgang.", "1,000 gold in one run."], ok: () => (S().gold || 0) >= 1000, r: { hero: "E" } },
    { id: "ohnetrank", n: ["Trocken", "Dry"], d: ["Das dritte Gebiet erreichen, ohne einen Trank zu trinken.", "Reach the third area without drinking a potion."], ok: () => Z.run && (Z.run.route || []).length >= 3 && !(S().potions > 0), r: { bonus: "trank" } },
    { id: "federleicht", n: ["Federleicht", "Featherlight"], d: ["Das dritte Gebiet erreichen, ohne einmal abzustürzen.", "Reach the third area without falling once."], ok: () => Z.run && (Z.run.route || []).length >= 3 && !(S().falls > 0), r: { cape: "weiss" } },
    { id: "fallen", n: ["Hinterlistig", "Devious"], d: ["10 Gegner in einem Durchgang durch Fallen oder Abgründe.", "10 enemies in one run via traps or chasms."], ok: () => (S().trapKills || 0) + (S().fallKills || 0) >= 10, r: { cape: "glut" } },
    { id: "serie", n: ["Schlachtfest", "Slaughterfest"], d: ["Eine Kill-Serie von 8.", "A kill streak of 8."], ok: () => (S().bestStreak || 0) >= 8, r: { cape: "schatten" } },
    { id: "sturz", n: ["Meteor", "Meteor"], d: ["25 Sturzangriffe in einem Durchgang.", "25 dive attacks in one run."], ok: () => (S().dives || 0) >= 25, r: { cape: "sturm" } },
    { id: "paarung", n: ["Paarungskundig", "Pair Savant"], d: ["5 verschiedene Paarungen entdecken.", "Discover 5 different pairings."], ok: () => Object.keys(M().syn || {}).length >= 5, r: { cape: "zwilling" } },
    { id: "pakt", n: ["Blutpakt", "Blood Pact"], d: ["Ein Ende mit mindestens 3 Pakten erreichen.", "Reach an ending with at least 3 pacts."], ok: () => false, r: { cape: "blut" } },
    { id: "ende", n: ["Ein Faden", "One Thread"], d: ["Ein Ende erreichen.", "Reach an ending."], ok: () => Object.keys(M().endings || {}).length > 0, r: { cape: "ruhm" } },
    { id: "alle", n: ["Drei Fäden", "Three Threads"], d: ["Alle drei Enden erreichen.", "Reach all three endings."], ok: () => { const e = M().endings || {}; return e.tiefe && e.glut && e.himmel; }, r: { cape: "faden" } },
    { id: "runen", n: ["Runenleser", "Rune Reader"], d: ["Alle drei Runen-Fragmente finden.", "Find all three rune fragments."], ok: () => Object.keys(M().runes || {}).length >= 3, r: { bonus: "riss" } },
    { id: "wahr", n: ["Die Weberin", "The Weaver"], d: ["Das wahre Ende erreichen.", "Reach the true ending."], ok: () => !!(M().endings || {}).wahr, r: { cape: "weberin" } },
    { id: "sammler", n: ["Sammler", "Collector"], d: ["20 verschiedene Waffen oder Fähigkeiten finden.", "Find 20 different weapons or skills."], ok: () => Object.keys(M().found || {}).length >= 20, r: { bonus: "startwaffe" } },
    { id: "zorn", n: ["Vernichter", "Annihilator"], d: ["Ein einzelner Treffer mit 500 Schaden.", "A single hit of 500 damage."], ok: () => (S().maxHit || 0) >= 500, r: { cape: "zorn" } },
    { id: "zaeh", n: ["Unverwüstlich", "Relentless"], d: ["10-mal gefallen und immer wieder aufgestanden.", "Fallen 10 times and always got back up."], ok: () => (M().deaths || 0) >= 10, r: { bonus: "leben" } },
    { id: "ereignis", n: ["Abenteurer", "Adventurer"], d: ["5 Raum-Ereignisse abschließen.", "Complete 5 room events."], ok: () => (M().events || 0) >= 5, r: { bonus: "glueck" } },
    { id: "tagebuch", n: ["Miras Chronist", "Mira's Chronicler"], d: ["Alle 13 Seiten aus Miras Tagebuch finden.", "Find all 13 pages of Mira's diary."], ok: () => Object.keys(M().tagebuch || {}).length >= 13, r: { cape: "karte" } },
    { id: "hinterhalt", n: ["Nicht mit mir", "Not Today"], d: ["3 Hinterhalte in einem Durchgang überstehen.", "Survive 3 ambushes in one run."], ok: () => (S().ambushes || 0) >= 3, r: { cape: "rune" } },
    { id: "befreier", n: ["Kettensprenger", "Chainbreaker"], d: ["3 gefesselte Kundschafter befreien.", "Free 3 shackled scouts."], ok: () => (M().befreit || 0) >= 3, r: { cape: "kundschaft" } },
    { id: "spuren", n: ["Spurenleser", "Tracker"], d: ["10 Spuren früherer Abenteurer lesen.", "Read 10 traces of earlier adventurers."], ok: () => (M().spuren || 0) >= 10, r: { cape: "pergament" } },
    { id: "schleicher", n: ["Leise Sohlen", "Soft Soles"], d: ["5 schlafende Gegner überraschen.", "Ambush 5 sleeping enemies."], ok: () => (M().ueberrascht || 0) >= 5, r: { cape: "nacht" } },
    { id: "wette", n: ["Wettkönig", "Bet King"], d: ["Barradins Wette gewinnen.", "Win Barradin's bet."], ok: () => !!M().betWon, r: { cape: "gold" } }
  ];
  Z.ACH = ACH;
  const BONUS = { trank: ["+1 Trank zu Beginn jedes Durchgangs", "+1 potion at the start of every run"], riss: ["Ein Riss im Netz öffnet sich nach jedem Endboss", "A rift in the web opens after every final boss"], startwaffe: ["Nundro gibt dir eine zufällige gefundene Waffe mit", "Nundro gives you a random found weapon to start"], leben: ["+10 Leben", "+10 health"], glueck: ["Mehr Raum-Ereignisse", "More room events"] };
  function rewardText(r) { if (r.cape) return L(["Umhang: ", "Cape: "]) + L(CAPES[r.cape].n); if (r.hero) return L(["Neuer Held: ", "New hero: "]) + L(HEROES[r.hero].n); if (r.bonus) return L(BONUS[r.bonus]); if (r.titel) return L(["Titel: ", "Title: "]) + "„" + L(r.titel) + "“"; return ""; }
  function grant(a) {
    const m = M(); if (!a || m.ach[a.id]) return; m.ach[a.id] = Date.now();
    if (a.r.cape) m.capes[a.r.cape] = 1; if (a.r.hero) m.heroes[a.r.hero] = 1; if (a.r.bonus) m.bonus[a.r.bonus] = 1;
    Z.saveMeta(); A.play("holy", { vol: 0.6 });
    if (Z.ui && Z.ui.notify) Z.ui.notify("🏆 <b>" + L(["Erfolg: ", "Achievement: "]) + esc(L(a.n)) + "</b><br><small>" + esc(rewardText(a.r)) + '</small><i data-ach="' + a.id + '" hidden></i>', { prio: 1, art: "sieg", dauer: 3600 }); else Z.toast && Z.toast("🏆 <b>" + esc(L(a.n)) + "</b>", 4200);
  }
  let achT = 0;
  function achTick(dt) { achT -= dt; if (achT > 0) return; achT = 1; for (const a of ACH) if (!M().ach[a.id]) { let ok = false; try { ok = a.ok(); } catch (_) {} if (ok) { grant(a); break; } } }
  Z.grantAch = id => { const a = ACH.find(x => x.id === id); if (a) grant(a); };

  /* ======================= ERFOLGE II (W13, Nutzerwunsch): Kategorien, Fortschritt, Titel ======================= */
  /* Kategorien (Reiter in der Erfolge-Ansicht). Alte Erfolge behalten ihre ids und werden nur einsortiert. */
  const KAT = [
    { id: "geschichte", i: "📜", n: ["Geschichte", "Story"] }, { id: "tempo", i: "⏱", n: ["Tempo", "Speed"] },
    { id: "kampf", i: "⚔", n: ["Kampftechnik", "Technique"] }, { id: "makellos", i: "🛡", n: ["Makellos", "Flawless"] },
    { id: "erkunden", i: "🗺", n: ["Erkundung", "Exploration"] }, { id: "bosse", i: "☠", n: ["Bosse", "Bosses"] },
    { id: "sammeln", i: "🏕", n: ["Sammeln & Lager", "Collecting & Camp"] }, { id: "spass", i: "🎭", n: ["Kurioses", "Curiosities"] }
  ];
  const OLDC = { erstesblut: "kampf", hundert: "kampf", parade: "kampf", ausweichen: "kampf", serie: "kampf", sturz: "kampf", fallen: "kampf", zorn: "kampf", boss: "bosse",
    gold: "sammeln", sammler: "sammeln", paarung: "sammeln", ohnetrank: "makellos", federleicht: "makellos", runen: "erkunden", tagebuch: "erkunden", spuren: "erkunden",
    befreier: "erkunden", ereignis: "erkunden", hinterhalt: "erkunden", schleicher: "kampf", wette: "spass" };
  const n0 = o => Object.keys(o || {}).length;
  const OLDP = { hundert: () => [S().kills || 0, 100], parade: () => [S().parries || 0, 10], ausweichen: () => [S().dodges || 0, 20], serie: () => [S().bestStreak || 0, 8],
    sturz: () => [S().dives || 0, 25], fallen: () => [(S().trapKills || 0) + (S().fallKills || 0), 10], gold: () => [S().gold || 0, 1000], sammler: () => [n0(M().found), 20],
    paarung: () => [n0(M().syn), 5], runen: () => [n0(M().runes), 3], tagebuch: () => [n0(M().tagebuch), 13], spuren: () => [M().spuren || 0, 10], befreier: () => [M().befreit || 0, 3],
    ereignis: () => [M().events || 0, 5], hinterhalt: () => [S().ambushes || 0, 3], schleicher: () => [M().ueberrascht || 0, 5], zaeh: () => [M().deaths || 0, 10], alle: () => [["tiefe", "glut", "himmel"].filter(k => (M().endings || {})[k]).length, 3] };
  for (const a of ACH) { a.c = OLDC[a.id] || "geschichte"; if (OLDP[a.id]) a.p = OLDP[a.id]; }
  /* neue Umhänge (kein Blau) */
  Object.assign(CAPES, {
    blitz: { n: ["Eilbote", "Courier"], c: ["#e8c040", "#5a4010"] }, eisen: { n: ["Eisen", "Iron"], c: ["#6a6866", "#262422"] },
    rubin: { n: ["Rubin", "Ruby"], c: ["#a0102a", "#3a0410"] }, kupfer: { n: ["Kupfer", "Copper"], c: ["#b8683a", "#4a2410"] },
    nebel: { n: ["Nebel", "Mist"], c: ["#b0aaa0", "#5a5650"] }, asche: { n: ["Asche", "Ash"], c: ["#8a8580", "#3a3634"] },
    elfenbein: { n: ["Elfenbein", "Ivory"], c: ["#efe6d0", "#a89a80"] }, koenig: { n: ["Königsmantel", "Royal Mantle"], c: ["#7a1020", "#e5b454"] },
    lava: { n: ["Lava", "Lava"], c: ["#c83a10", "#2a0804"] }, smaragd: { n: ["Smaragd", "Emerald"], c: ["#2a7a4a", "#0e2a1a"] },
    bernstein: { n: ["Bernstein", "Amber"], c: ["#d8901a", "#5a3008"] }, dorn: { n: ["Dornen", "Thorns"], c: ["#4a6a2a", "#1a2a0e"] },
    tang: { n: ["Seetang", "Kelp"], c: ["#3a5a3a", "#142014"] }, violett: { n: ["Waffenmeister", "Weaponmaster"], c: ["#6a2a7a", "#24082a"] }
  });
  /* dauerhafte Zähler (alte Spielstände: fehlt achZ, wird leer angelegt) */
  function X() { const m = M(); const x = m.achZ || (m.achZ = {}); x.wk = x.wk || {}; x.mini = x.mini || {}; x.nhB = x.nhB || {}; x.bio = x.bio || {}; return x; }
  /* Laufzähler: hängen am Lauf-Objekt (neuer Lauf = frischer Zähler) */
  function RA() {
    const run = Z.run; if (!run) return null;
    return run._a || (run._a = { ar: {}, lv: null, dmg: null, dmgRun: 0, par: null, parC: 0, parB: 0, dod: null, dodC: 0, dodB: 0, plT: -9, swRel: -9, swCur: null, swLast: null, swGround: true, swChain: 0,
      fassC: 0, kran: false, wu: null, mo: null, fight: null, nhAreas: 0, up: 0, dive: 0, bash: 0, konter: 0, surp: 0, gnade: false, end: false });
  }
  const gnade = () => !!(Z.run && (Z.run.gnade || (Z.run._a && Z.run._a.gnade)));
  Z.achRun = RA;
  const TT = (de, en) => ({ titel: [de, en] });
  const mk = (c, id, n, d, ok, r, p) => ({ id, c, n, d, ok: ok || (() => false), r: r || {}, p });
  const runP = (k, max) => () => [(RA() || {})[k] || 0, max];
  /* Tempo-Grenzen je Gebiet in Sekunden (aus den Bot-Läufen W9: ca. schnellstes Viertel × 1,1 – schwer, aber machbar) */
  const TEMPO = { torhof: 35, keller: 50, hallen: 50, wehrgang: 40, verlies: 70, hafen: 70, glocken: 80, schlund: 140, schmiede: 140, zinnen: 140, see: 130, glut: 160, sturm: 160 };
  const WKL = { klinge: ["Klingen", "blades"], stich: ["Stichwaffen", "thrusting weapons"], faust: ["Faustwaffen", "fist weapons"], wucht: ["Wuchtwaffen", "heavy weapons"], sense: ["Sensen", "scythes"],
    stoss: ["Stoßwaffen", "polearms"], peitsche: ["Peitschen", "whips"], schild: ["Schilde", "shields"], schuss: ["Fernwaffen", "ranged weapons"] };
  const WKT = { klinge: ["Klingentänzer", "Bladedancer"], stich: ["Nadelstich", "the Needle"], faust: ["Eisenfaust", "Ironfist"], wucht: ["Steinbrecher", "Stonebreaker"], sense: ["Schnitter", "the Reaper"],
    stoss: ["Pfeiler", "the Pillar"], peitsche: ["Peitschenknall", "Whipcrack"], schild: ["Bollwerk", "the Bulwark"], schuss: ["Adlerauge", "Eagle Eye"] };
  const WKN = 50;
  const NEU = [
    /* Tempo (Gebiete kommen in late() dazu, weil die Namen aus welt.js stammen) */
    mk("tempo", "t_lauf20", ["Eilbote", "Courier"], ["Ein Ende in unter 20 Minuten erreichen.", "Reach an ending in under 20 minutes."], null, { cape: "blitz" }),
    mk("tempo", "t_lauf12", ["Darkin-Sturm", "Darkin Storm"], ["Ein Ende in unter 12 Minuten erreichen.", "Reach an ending in under 12 minutes."], null, TT("der Rasende", "the Swift")),
    mk("tempo", "t_boss", ["Kurzer Prozess", "Short Work"], ["Einen Arena-Boss in unter 45 Sekunden ab Kampfbeginn besiegen.", "Defeat an arena boss within 45 seconds of the fight starting."], null, TT("Kurzer Prozess", "Short Work")),
    mk("tempo", "t_waechter", ["Wachwechsel", "Changing of the Guard"], ["Einen Wächter in unter 30 Sekunden besiegen.", "Defeat a warden in under 30 seconds."], null, { cape: "eisen" }),
    /* Kampftechnik */
    mk("kampf", "k_parkette", ["Stahlwand", "Wall of Steel"], ["5 Paraden in Folge, ohne dazwischen getroffen zu werden.", "5 parries in a row without being hit in between."], () => (RA() || {}).parB >= 5, { cape: "kupfer" }, () => [(RA() || {}).parB || 0, 5]),
    mk("kampf", "k_rollkette", ["Windhauch", "Breath of Wind"], ["10 perfekte Ausweichrollen in Folge, ohne getroffen zu werden.", "10 perfect dodges in a row without being hit."], () => (RA() || {}).dodB >= 10, { cape: "nebel" }, () => [(RA() || {}).dodB || 0, 10]),
    mk("kampf", "k_auf", ["Himmelsstürmer", "Skystormer"], ["15 Gegner in einem Durchgang mit Aufwärtsangriffen erledigen.", "Finish 15 enemies with upward attacks in one run."], () => (RA() || {}).up >= 15, TT("Himmelsstürmer", "Skystormer"), runP("up", 15)),
    mk("kampf", "k_sturz", ["Hammer von oben", "Hammer from Above"], ["15 Gegner in einem Durchgang mit Sturzangriffen erledigen.", "Finish 15 enemies with dive attacks in one run."], () => (RA() || {}).dive >= 15, TT("Meteor", "the Meteor"), runP("dive", 15)),
    mk("kampf", "k_schild", ["Schildbrecher", "Shieldbreaker"], ["10 Gegner in einem Durchgang mit Schildstößen erledigen.", "Finish 10 enemies with shield bashes in one run."], () => (RA() || {}).bash >= 10, TT("Rammbock", "the Ram"), runP("bash", 10)),
    mk("kampf", "k_konter", ["Gegenschlag", "Riposte"], ["5 Gegner in einem Durchgang durch Paraden-Konter erledigen.", "Finish 5 enemies with parry counters in one run."], () => (RA() || {}).konter >= 5, TT("Konterkünstler", "Riposte Artist"), runP("konter", 5)),
    mk("kampf", "k_umg", ["Hausrecht", "Home Advantage"], ["25 Gegner durch Fallen, Abgründe oder Wände erledigen (insgesamt).", "Finish 25 enemies with traps, chasms or walls (total)."], () => (X().umg || 0) >= 25, { cape: "asche" }, () => [X().umg || 0, 25]),
    mk("kampf", "k_leuchter", ["Aus dem Leuchter", "Chandelier Drop"], ["Einen Gegner erledigen, kurz nachdem du vom Kronleuchter gesprungen bist – noch in der Luft.", "Finish an enemy right after leaping off a chandelier – still airborne."], null, TT("Lüsterflieger", "Chandelier Flyer")),
    mk("kampf", "k_serie15", ["Blutrausch", "Bloodrush"], ["Eine Kill-Serie von 15.", "A kill streak of 15."], () => (S().bestStreak || 0) >= 15, { cape: "rubin" }, () => [S().bestStreak || 0, 15]),
    mk("kampf", "k_ueber", ["Aus dem Schatten", "From the Shadows"], ["15 Gegner in einem Durchgang überrumpeln.", "Catch 15 enemies off guard in one run."], () => (RA() || {}).surp >= 15, TT("Schatten", "the Shadow"), runP("surp", 15)),
    mk("kampf", "k_elite", ["Elitejäger", "Elite Hunter"], ["10 Elite-Gegner in einem Durchgang besiegen.", "Defeat 10 elite enemies in one run."], () => (S().elites || 0) >= 10, TT("Elitejäger", "Elite Hunter"), () => [S().elites || 0, 10]),
    ...Object.keys(WKL).map(k => mk("kampf", "k_w_" + k, [WKT[k][0], WKT[k][1]], [WKN + " Gegner mit " + WKL[k][0] + " erledigen (insgesamt).", "Finish " + WKN + " enemies with " + WKL[k][1] + " (total)."], () => (X().wk[k] || 0) >= WKN, TT(WKT[k][0], WKT[k][1]), () => [X().wk[k] || 0, WKN])),
    mk("kampf", "k_meister", ["Waffenmeister", "Weaponmaster"], ["Mit jeder der neun Waffengattungen " + WKN + " Gegner erledigen.", "Finish " + WKN + " enemies with each of the nine weapon types."], () => Object.keys(WKL).every(k => (X().wk[k] || 0) >= WKN), { cape: "violett" }, () => [Object.keys(WKL).filter(k => (X().wk[k] || 0) >= WKN).length, 9]),
    /* Makellos (ohne Treffer; unter Barmherzigkeit gesperrt) */
    mk("makellos", "nh_gebiet", ["Kein Kratzer", "Not a Scratch"], ["Ein Gebiet ohne einen Treffer abschließen.", "Clear an area without taking a hit."], null, TT("der Unversehrte", "the Unscathed")),
    mk("makellos", "nh_gebiet3", ["Eisern", "Ironclad"], ["Drei Gebiete in einem Durchgang ohne Treffer abschließen.", "Clear three areas without a hit in one run."], () => (RA() || {}).nhAreas >= 3, TT("der Eiserne", "the Ironclad"), runP("nhAreas", 3)),
    mk("makellos", "nh_lauf", ["Makellos", "Flawless"], ["Ein Ende erreichen, ohne ein einziges Mal getroffen zu werden.", "Reach an ending without being hit even once."], null, { cape: "elfenbein" }),
    mk("makellos", "nh_heil", ["Ohne Heilung", "No Mending"], ["Ein Ende erreichen, ohne einen Trank zu trinken.", "Reach an ending without drinking a potion."], null, TT("der Durstige", "the Parched")),
    mk("makellos", "nh_voll", ["Volles Leben", "Full Health"], ["Ein Gebiet mit vollem Leben verlassen.", "Leave an area at full health."], null, TT("der Heile", "the Whole")),
    /* Erkundung */
    mk("erkunden", "e_geheim", ["Spürnase", "Keen Nose"], ["Alle Geheimnisse eines Gebiets finden.", "Find every secret of an area."], null, TT("Spürnase", "Keen Nose")),
    mk("erkunden", "e_geheim5", ["Schatzsucher", "Treasure Seeker"], ["In 5 Gebieten alle Geheimnisse finden (insgesamt).", "Find every secret in 5 areas (total)."], () => (X().gA || 0) >= 5, TT("Schatzsucher", "Treasure Seeker"), () => [X().gA || 0, 5]),
    mk("erkunden", "e_geheim25", ["Verborgene Pfade", "Hidden Paths"], ["25 Geheimnisse finden (insgesamt).", "Find 25 secrets (total)."], () => (M().geheimnisse || 0) >= 25, TT("Pfadfinder", "Pathfinder"), () => [M().geheimnisse || 0, 25]),
    mk("erkunden", "e_karte", ["Kartograf", "Cartographer"], ["Jeden Raum eines Gebiets betreten (Geheimräume zählen nicht).", "Enter every room of an area (secret rooms don't count)."], null, TT("Kartograf", "Cartographer")),
    mk("erkunden", "e_gebiete", ["Weltenbummler", "Globetrotter"], ["Alle 13 Gebiete der Feste betreten.", "Enter all 13 areas of the keep."], () => Object.keys(TEMPO).every(k => X().bio[k]), { cape: "smaragd" }, () => [Object.keys(TEMPO).filter(k => X().bio[k]).length, 13]),
    mk("erkunden", "e_wucht", ["Mauerbrecher", "Wallbreaker"], ["10 Wucht-Risse zerschlagen (insgesamt).", "Smash 10 cracked walls (total)."], () => (X().wu || 0) >= 10, TT("Mauerbrecher", "Wallbreaker"), () => [X().wu || 0, 10]),
    mk("erkunden", "e_morsch", ["Durchgebrochen", "Fell Through"], ["5 morsche Böden durchbrechen (insgesamt).", "Break through 5 rotten floors (total)."], () => (X().mo || 0) >= 5, TT("Schwergewicht", "Heavyweight"), () => [X().mo || 0, 5]),
    mk("erkunden", "e_flut", ["Schleusenwärter", "Lockkeeper"], ["Eine Flutkammer ablassen.", "Drain a flood chamber."], null, { cape: "tang" }),
    mk("erkunden", "e_kran", ["Kranführer", "Crane Operator"], ["Mit einem Lastenkran fahren.", "Ride a cargo crane."], () => (X().kran || 0) >= 1, TT("Kranführer", "Crane Operator")),
    mk("erkunden", "e_rueck", ["Kein Weg zu weit", "No Road Too Far"], ["Den Rückweg in ein früheres Gebiet nutzen.", "Use the way back into an earlier area."], null, TT("Heimkehrer", "Homecomer")),
    mk("erkunden", "e_raetsel", ["Rätselmeister", "Puzzle Master"], ["Ein Hebelrätsel in einem Geheimraum lösen.", "Solve a lever puzzle in a secret room."], () => (X().raetsel || 0) >= 1, TT("Rätselmeister", "Puzzle Master")),
    mk("erkunden", "e_raetsel5", ["Schlossknacker", "Lockbreaker"], ["5 Hebelrätsel lösen (insgesamt).", "Solve 5 lever puzzles (total)."], () => (X().raetsel || 0) >= 5, TT("Schlossknacker", "Lockbreaker"), () => [X().raetsel || 0, 5]),
    mk("erkunden", "e_variante", ["Wechselhafte Feste", "Shifting Keep"], ["Ein Gebiet mit besonderer Variante (z. B. Fallengänge, Goldader, Einsturzgefahr) abschließen.", "Clear an area with a special variant (e.g. Trapped Halls, Gold Vein, Cave-in)."], null, TT("Wetterfest", "Weatherproof")),
    mk("erkunden", "e_wunder", ["Staunender", "Wonderstruck"], ["3 verschiedene Wunder sehen.", "See 3 different wonders."], () => Z.wunder && Z.wunder.seen() >= 3, TT("Staunender", "the Wonderstruck"), () => [Z.wunder ? Z.wunder.seen() : 0, 3]),
    /* Sammeln & Lager */
    mk("sammeln", "s_palisade", ["Palisade", "Palisade"], ["Das Lager wächst zur Palisade.", "The camp grows to a palisade."], () => Z.lager && Z.lager.stage() >= 3, TT("Lagerhauptmann", "Camp Captain"), () => [Z.lager ? Z.lager.stage() : 0, 3]),
    mk("sammeln", "s_banner", ["Banner im Wind", "Banners in the Wind"], ["Das Lager hisst seine Banner.", "The camp raises its banners."], () => Z.lager && Z.lager.stage() >= 4, TT("Bannerträger", "Bannerman"), () => [Z.lager ? Z.lager.stage() : 0, 4]),
    mk("sammeln", "s_feste", ["Die Feste vor der Feste", "The Keep before the Keep"], ["Das Lager auf die höchste Stufe bringen.", "Raise the camp to its highest stage."], () => Z.lager && Z.lager.stage() >= 5, TT("Burgherr", "Lord of the Keep"), () => [Z.lager ? Z.lager.stage() : 0, 5]),
    mk("sammeln", "s_bewohner", ["Volles Haus", "Full House"], ["Alle Bewohner ins Lager holen.", "Bring every resident to the camp."], () => { const R2 = Z.lager && Z.lager.RES; return !!R2 && Object.keys(R2).every(k => Z.lager.residents().includes(k)); }, TT("Gastgeber", "the Host"), () => { const R2 = Z.lager && Z.lager.RES; return R2 ? [Object.keys(R2).filter(k => Z.lager.residents().includes(k)).length, Object.keys(R2).length] : [0, 1]; }),
    mk("sammeln", "s_plus5", ["Meisterstück", "Masterpiece"], ["Eine Waffe auf +5 bringen.", "Raise a weapon to +5."], () => { const P = Z.player; return !!(P && P.slots && Object.values(P.slots).some(it => it && (it.plus || 0) >= 5)); }, TT("Meisterschmied", "Mastersmith")),
    mk("sammeln", "s_segen3", ["Gesegnet", "Blessed"], ["Drei Segen gleichzeitig tragen.", "Carry three blessings at once."], () => !!(Z.run && Z.player && (Z.player.bless || []).length >= 3), TT("der Gesegnete", "the Blessed"), () => [Z.run && Z.player ? (Z.player.bless || []).length : 0, 3]),
    mk("sammeln", "s_gold", ["Schatzmeister", "Treasurer"], ["5.000 Gold sammeln (insgesamt).", "Collect 5,000 gold (total)."], () => (M().totalGold || 0) >= 5000, { cape: "bernstein" }, () => [M().totalGold || 0, 5000]),
    mk("sammeln", "s_waffen", ["Waffenkammer", "Armoury"], ["40 verschiedene Waffen oder Fähigkeiten finden.", "Find 40 different weapons or skills."], () => n0(M().found) >= 40, TT("Sammler", "the Collector"), () => [n0(M().found), 40]),
    mk("sammeln", "s_umhang", ["Garderobe", "Wardrobe"], ["15 Umhänge besitzen.", "Own 15 capes."], () => n0(M().capes) >= 15, TT("Modegeck", "the Dandy"), () => [n0(M().capes), 15]),
    /* Kurioses */
    mk("spass", "f_fass", ["Fass-Surfer", "Barrel Surfer"], ["Dreimal hintereinander auf rollende Fässer springen, ohne den Boden zu berühren.", "Bounce on rolling barrels three times in a row without touching the ground."], null, TT("Fass-Surfer", "Barrel Surfer")),
    mk("spass", "f_tarzan", ["Tarzan", "Tarzan"], ["Von einem Kronleuchter direkt zum nächsten schwingen.", "Swing from one chandelier straight to the next."], null, TT("Tarzan", "Tarzan")),
    mk("spass", "f_pazifist", ["Pazifist", "Pacifist"], ["Ein Gebiet verlassen, ohne einen einzigen Gegner zu erledigen.", "Leave an area without finishing a single enemy."], null, TT("der Sanfte", "the Gentle")),
    mk("spass", "f_nass", ["Nasse Füße", "Wet Feet"], ["Dreimal von der steigenden Flut erwischt werden.", "Get caught by the rising tide three times."], () => (X().nass || 0) >= 3, TT("Wasserratte", "Water Rat"), () => [X().nass || 0, 3]),
    mk("spass", "f_goblin", ["Goldgräber", "Gold Digger"], ["Drei Goldgoblins erwischen (insgesamt).", "Catch three gold goblins (total)."], () => (X().dieb || 0) >= 3, TT("Goblinschreck", "Goblin's Bane"), () => [X().dieb || 0, 3]),
    mk("spass", "f_rennen", ["Gegen die Uhr", "Against the Clock"], ["Eine Zeitrennen-Kammer schaffen.", "Beat a time trial chamber."], () => (X().rennen || 0) >= 1, TT("Sanduhrjäger", "Hourglass Hunter")),
    mk("spass", "f_faust", ["Mit bloßen Fäusten", "Bare-Knuckle"], ["10 Gegner in einem Durchgang mit bloßen Fäusten erledigen.", "Finish 10 enemies bare-handed in one run."], () => ((S().killsBy || {}).faeuste || 0) >= 10, TT("Faustkämpfer", "the Brawler"), () => [(S().killsBy || {}).faeuste || 0, 10])
  ];
  for (const a of NEU) ACH.push(a);
  /* Gebiete, Bosse, Mini-Bosse: Namen/Ids erst bekannt, wenn alle Dateien geladen sind (demogorgon.js lädt später) */
  const bossIds = () => Object.keys(Z.BOSSDEF || {}).filter(id => id !== "nezna" && !Z.BOSSDEF[id].minion && !Z.BOSSDEF[id].noAch);
  const miniIds = () => Object.keys(Z.ENEMIES || {}).filter(id => /^mb_/.test(id));
  const enThe = s => String(s).replace(/^The /, "the ");
  const bossN = id => (Z.BOSSDEF[id] && Z.BOSSDEF[id].n) || [id, id];
  let dynDone = false;
  function buildDyn() {
    if (dynDone || !Z.BIOMES || !Z.BOSSDEF) return; dynDone = true;
    const at = id => ACH.findIndex(a => a.id === id);
    const ins = (afterId, list) => { const i = at(afterId); ACH.splice(i < 0 ? ACH.length : i + 1, 0, ...list); };
    ins("t_waechter", Object.keys(TEMPO).filter(k => Z.BIOMES[k]).map(k => { const nm = Z.BIOMES[k].name || [k, k]; return mk("tempo", "t_" + k, ["Eile: " + nm[0], "Haste: " + nm[1]], [nm[0] + " in unter " + TEMPO[k] + " Sekunden durchqueren.", "Cross " + nm[1] + " in under " + TEMPO[k] + " seconds."], null, TT("Läufer", "the Runner")); }));
    const BT = { glasstab: TT("Glasbrecher", "Glassbreaker"), erzpriesterin: TT("Ketzer", "the Heretic"), bugbear: TT("Bärentöter", "Bearslayer"), wraith: TT("Geisterbanner", "Ghostbinder"), schmiedewaechter: TT("Ambossbrecher", "Anvilbreaker"),
      chasme: TT("Fliegenklatsche", "the Flyswatter"), ilvaraW: TT("Netzreißer", "Webtearer"), riese: TT("Riesentöter", "Giantslayer"), vrock: TT("Geierschreck", "Vulture's Bane"), demogorgon: TT("Dämonenfürst-Bezwinger", "Demon Prince's Bane"),
      themberchaud: TT("Drachenbändiger", "Dragontamer"), venomfang: TT("Giftzahnzieher", "Fangpuller"), weberin: TT("Fadenlos", "the Unthreaded") };
    const ids = bossIds();
    const bossW = ids.map(id => { const nm = bossN(id); return mk("bosse", "b_" + id, ["Sieg: " + nm[0], "Victory: " + nm[1]], [nm[0] + " besiegen.", "Defeat " + enThe(nm[1]) + "."], () => !!((M().bosses || {})[id] && M().bosses[id].won > 0), BT[id] || TT("Bezwinger", "the Conqueror")); });
    const mins = miniIds();
    bossW.push(mk("bosse", "b_mini", ["Kopfgeldjäger", "Bounty Hunter"], ["Alle " + mins.length + " Mini-Bosse besiegen (insgesamt).", "Defeat all " + mins.length + " mini-bosses (total)."], () => mins.every(k => X().mini[k]), { cape: "dorn" }, () => [mins.filter(k => X().mini[k]).length, mins.length]));
    bossW.push(mk("bosse", "b_schaedel3", ["Schädelträger", "Skullbearer"], ["Ein Ende mit mindestens 3 Schädeln erreichen.", "Reach an ending with at least 3 skulls."], null, TT("Schädelträger", "Skullbearer")));
    bossW.push(mk("bosse", "b_schaedel5", ["Schädelkönig", "Skull King"], ["Ein Ende mit 5 Schädeln erreichen.", "Reach an ending with 5 skulls."], null, { cape: "lava" }));
    bossW.push(mk("bosse", "b_alle", ["Trophäenwand", "Trophy Wall"], ["Jeden Boss und Wächter mindestens einmal besiegen.", "Defeat every boss and warden at least once."], () => ids.every(id => (M().bosses || {})[id] && M().bosses[id].won > 0), { cape: "koenig" }, () => [ids.filter(id => (M().bosses || {})[id] && M().bosses[id].won > 0).length, ids.length]));
    ins("boss", bossW);
    ins("nh_voll", ids.map(id => { const nm = bossN(id); return mk("makellos", "nh_" + id, ["Unberührt: " + nm[0], "Untouched: " + nm[1]], [nm[0] + " besiegen, ohne getroffen zu werden.", "Defeat " + enThe(nm[1]) + " without being hit."], () => !!X().nhB[id], TT("Tänzer", "the Dancer")); }));
    enrich();
  }
  Z.achBuild = buildDyn;
  /* Klang/Grafik-Schnittstelle: kat (Kategorie), selten (Fanfare), siegel {motiv, stufe} je Erfolg */
  const KATN = { tempo: "tempo", kampf: "technik", makellos: "nohit", erkunden: "erkundung", bosse: "bosse", sammeln: "sammeln", spass: "kurios", geschichte: "geschichte" };
  const SELTEN = ["nh_lauf", "t_lauf12", "b_schaedel5", "b_alle", "k_meister", "wahr", "alle", "nh_gebiet3", "b_mini", "s_feste", "e_gebiete", "k_rollkette", "nh_weberin", "nh_demogorgon"];
  const GOLD = ["t_lauf20", "t_boss", "t_waechter", "k_parkette", "k_serie15", "k_ueber", "k_elite", "b_schaedel3", "nh_heil", "e_geheim5", "s_bewohner", "s_plus5", "s_banner", "f_fass", "f_tarzan", "f_rennen", "e_raetsel5", "zorn", "runen", "tagebuch", "pakt", "b_weberin", "b_demogorgon", "s_gold", "s_waffen"];
  const BRONZE = ["erstesblut", "ende", "boss", "e_kran", "e_flut", "e_rueck", "nh_voll", "f_pazifist", "f_nass", "e_morsch", "zaeh", "gold", "hundert", "ereignis", "befreier", "spuren", "s_umhang"];
  const MOTIV_K = { tempo: "sanduhr", kampf: "schwert", makellos: "schild", erkunden: "karte", bosse: "krone", sammeln: "truhe", spass: "stern", geschichte: "faden" };
  const MOTIV = { erstesblut: "schwert", hundert: "tod", parade: "schild", ausweichen: "feder", boss: "krone", gold: "muenze", ohnetrank: "trank", federleicht: "feder", fallen: "zahnrad",
    serie: "flamme", sturz: "pfeil", paarung: "herz", pakt: "tod", ende: "faden", alle: "faden", runen: "rune", wahr: "faden", sammler: "truhe", zorn: "blitz", zaeh: "herz", ereignis: "stern",
    tagebuch: "karte", hinterhalt: "auge", befreier: "tor", spuren: "pfote", schleicher: "auge", wette: "muenze",
    t_lauf20: "blitz", t_lauf12: "blitz", t_boss: "sanduhr", t_waechter: "sanduhr", k_parkette: "schild", k_rollkette: "feder", k_auf: "pfeil", k_sturz: "blitz", k_schild: "schild", k_konter: "schwert",
    k_umg: "zahnrad", k_leuchter: "glocke", k_serie15: "flamme", k_ueber: "auge", k_elite: "tod", k_meister: "sieg", nh_gebiet: "schild", nh_gebiet3: "schild", nh_lauf: "herz", nh_heil: "trank", nh_voll: "herz",
    e_geheim: "auge", e_geheim5: "truhe", e_geheim25: "auge", e_karte: "karte", e_gebiete: "karte", e_wucht: "zahnrad", e_morsch: "zahnrad", e_flut: "tor", e_kran: "zahnrad", e_rueck: "tor", e_wunder: "stern",
    s_palisade: "tor", s_banner: "krone", s_feste: "krone", s_bewohner: "herz", s_plus5: "flamme", s_segen3: "stern", s_gold: "muenze", s_waffen: "schwert", s_umhang: "faden",
    f_fass: "zahnrad", f_tarzan: "glocke", f_pazifist: "herz", f_nass: "trank", f_goblin: "muenze", f_faust: "schwert", f_rennen: "sanduhr", e_raetsel: "zahnrad", e_raetsel5: "rune", e_variante: "stern", b_mini: "tod", b_schaedel3: "schaedel", b_schaedel5: "schaedel", b_alle: "sieg" };
  function enrich() {
    for (const a of ACH) {
      a.kat = KATN[a.c] || "geschichte";
      a.selten = SELTEN.includes(a.id);
      const stufe = a.selten ? "blut" : GOLD.includes(a.id) || /^nh_/.test(a.id) && a.id.length > 9 && !["nh_gebiet", "nh_voll", "nh_heil", "nh_lauf"].includes(a.id) ? "gold" : BRONZE.includes(a.id) || /^b_/.test(a.id) && a.c === "bosse" && !/^b_(mini|schaedel|alle)/.test(a.id) ? "bronze" : "silber";
      a.siegel = { motiv: MOTIV[a.id] || (/^k_w_/.test(a.id) ? (a.id === "k_w_schild" ? "schild" : a.id === "k_w_schuss" ? "pfeil" : "schwert") : /^nh_/.test(a.id) ? "schild" : /^b_/.test(a.id) ? "krone" : /^t_/.test(a.id) ? "sanduhr" : MOTIV_K[a.c] || "stern"), stufe };
    }
  }
  enrich();
  /* Z.erfolgSiegel(htmlOderId) → { motiv, stufe, id, kat, selten } – erkennt die id, die Erfolgs-Meldung (data-ach) oder den Namen */
  Z.erfolgSiegel = function (q) {
    q = String(q || ""); let a = ACH.find(x => x.id === q);
    if (!a) { const m = /data-ach="([^"]+)"/.exec(q); if (m) a = ACH.find(x => x.id === m[1]); }
    if (!a) a = ACH.find(x => q.includes(esc(L(x.n)) + "</b>")) || ACH.find(x => q.includes(esc(L(x.n))));
    if (!a) return null;
    return { motiv: a.siegel.motiv, stufe: a.siegel.stufe, id: a.id, kat: a.kat, selten: a.selten };
  };
  /* Testhaken: Liste, alle erfüllten sofort prüfen, erzwingen, zurücksetzen */
  Z.achTest = {
    list: () => ACH.map(a => ({ id: a.id, c: a.c, done: !!M().ach[a.id], p: a.p ? (() => { try { return a.p(); } catch (_) { return null; } })() : null })),
    check: () => { const out = []; for (const a of ACH) if (!M().ach[a.id]) { let ok = false; try { ok = a.ok(); } catch (_) {} if (ok) { grant(a); out.push(a.id); } } return out; },
    force: id => { const a = ACH.find(x => x.id === id); if (a) grant(a); return !!a; },
    reset: id => { const m = M(); if (id) delete m.ach[id]; else { m.ach = {}; m.achZ = {}; } Z.saveMeta(); },
    run: () => RA(), meta: () => X(), tick: dt => trackTick(dt || 1 / 60)
  };
  const getA = id => ACH.find(a => a.id === id);
  const give = id => { if (!M().ach[id]) grant(getA(id)); };
  /* Ereignisse aus anderen Dateien (Minimal-Hooks): Z.achEv("fass" | "flut" | "flutNass") */
  Z.achEv = function (k) {
    try {
      const A2 = RA(), P = Z.player; if (!A2 || !P) return;
      if (k === "fass") { A2.fassC = (A2.fassC || 0) + 1; if (A2.fassC >= 3) give("f_fass"); }
      else if (k === "flut") give("e_flut");
      else if (k === "flutNass") { X().nass = (X().nass || 0) + 1; }
    } catch (err) { console.error(err); }
  };
  /* Gebiet verlassen (nur über Z.loadArea – der Rückweg setzt Gebiete ohne loadArea ein und löst hier nichts aus) */
  function areaDone(to, opts) {
    const A2 = RA(), lv = Z.level, P = Z.player; if (!A2 || !lv || !P || P.dead || !to || to === "lager") return;
    if (to !== "passage" || !opts || opts.from !== lv.id) return; /* nur der echte Ausgang (spiel.js: Gebiet → Passage), kein Neustart/Testsprung */
    const id = lv.id; if (!id || lv.hub || lv.arena || lv.passage || !TEMPO[id]) return;
    const a = A2.ar[id]; if (!a || a.done) return; a.done = true;
    const fair = !gnade();
    if (fair && a.t > 0 && a.t <= TEMPO[id]) give("t_" + id);
    if (fair && a.dmg <= 0 && a.t > 15) { give("nh_gebiet"); A2.nhAreas++; }
    if (fair && P.hp >= P.hpMax - 0.5) give("nh_voll");
    if (!a.kills) give("f_pazifist");
    if (Z.run._var && Z.run._var.area === id) give("e_variante");
    const S2 = Z.erkundung && Z.erkundung();
    if (S2 && S2.lv === lv && S2.total > 0 && S2.found.size >= S2.total) { give("e_geheim"); X().gA = (X().gA || 0) + 1; }
    const need = Object.keys(lv.cells || {}).filter(k => lv.cells[k].kind !== "secret");
    if (need.length && need.every(k => a.cells[k])) give("e_karte");
    Z.saveMeta();
  }
  function areaRec(A2, id) { return A2.ar[id] || (A2.ar[id] = { t: 0, dmg: 0, kills: 0, done: false, cells: {} }); }
  /* Kill-Einordnung (äußerster Wrapper, siehe late) */
  function onKill(e, o) {
    const A2 = RA(), P = Z.player; if (!A2 || !P || o.self) return;
    const run = Z.run, now = run.time || 0;
    if (Z.level && Z.level.id && o.src !== "trap" && o.src !== "fall") areaRec(A2, Z.level.id).kills++; /* Pazifist: Fallen/Stürze zählen nicht */
    const act = P.act;
    const mel = o.src === "melee";
    if (act && act.up && (mel || o.src === "ranged")) A2.up++;
    if (mel && (P.plunge || now - A2.plT < 0.3)) A2.dive++;
    if (act && act.bash && (mel || !o.src)) A2.bash++;
    if (o.src === "parry") A2.konter++;
    if (o.src === "trap" || o.src === "fall" || o.src === "wall") X().umg = (X().umg || 0) + 1;
    if (!P.onGround && now - A2.swRel < 1.6 && !P._swing) give("k_leuchter");
    if (o.it && Z.WEAPONS[o.it.id] && Z.WEAPONS[o.it.id].kind && Z.upClass) { const k = Z.upClass(Z.WEAPONS[o.it.id]); if (WKL[k]) X().wk[k] = (X().wk[k] || 0) + 1; }
    if (e.id && /^mb_/.test(e.id)) { X().mini[e.id] = 1; Z.saveMeta(); }
    if (e.thief) X().dieb = (X().dieb || 0) + 1;
  }
  /* Bosskampf beendet */
  function bossWin(f) {
    const run = Z.run; if (!run) return;
    const fair = !gnade(), dt = (run.time || 0) - f.t0;
    if (fair && f.dmg <= 0 && f.id) { X().nhB[f.id] = 1; Z.saveMeta(); }
    if (fair && f.warden && dt < 30) give("t_waechter");
    if (fair && !f.warden && Z.level && Z.level.arena && dt < 45) give("t_boss");
  }
  /* Ende erreicht */
  function endCheck() {
    const A2 = RA(), run = Z.run; if (!A2 || A2.end) return; A2.end = true;
    if (gnade()) return;
    const t = run.time || 0;
    if (t < 1200) give("t_lauf20"); if (t < 720) give("t_lauf12");
    if (A2.dmgRun <= 0) give("nh_lauf");
    if (!(S().potions > 0)) give("nh_heil");
    if ((run.skulls || 0) >= 3) give("b_schaedel3"); if ((run.skulls || 0) >= 5) give("b_schaedel5");
  }
  let lvLoaded = null;
  /* Beobachtung pro Bild: Zeit/Treffer je Gebiet, Paraden-/Rollen-Ketten, Kran, Kronleuchter, Fässer, Bosskampf */
  function trackTick(dt) {
    const run = Z.run, P = Z.player, lv = Z.level; if (!run || !P || !lv || lv.hub) return;
    const A2 = RA();
    if (run.gnade) A2.gnade = true;
    /* Gebietswechsel ohne Z.loadArea = Rückweg (rueckweg.js setzt den Zustand direkt ein) */
    if (lv !== A2.lv) { if (A2.lv && lv !== lvLoaded && !A2.lv.hub) give("e_rueck"); A2.lv = lv; }
    const s = S();
    /* Treffer über erlittenen Schaden (zählt alles, auch Fallen und Stürze) */
    const dm = P.dmgTaken || 0;
    if (A2.dmg == null || dm < A2.dmg) A2.dmg = dm;
    const dd = dm - A2.dmg; A2.dmg = dm;
    const id = lv.id, rec = id && !lv.passage ? areaRec(A2, id) : null;
    if (dd > 0) { A2.dmgRun += dd; if (rec) rec.dmg += dd; if (A2.fight && !A2.fight.done) A2.fight.dmg += dd; A2.parC = 0; A2.dodC = 0; }
    if (rec && !P.dead) {
      rec.t += dt;
      const ck = Math.floor((P.x + P.w / 2) / T / Z.CW) + "," + Math.floor((P.y + P.h / 2) / T / Z.CH);
      if (lv.cells && lv.cells[ck]) rec.cells[ck] = 1;
    }
    /* Ketten */
    const pa = s.parries || 0, dg = s.dodges || 0;
    if (A2.par == null || pa < A2.par) A2.par = pa; if (A2.dod == null || dg < A2.dod) A2.dod = dg;
    if (pa > A2.par) { A2.parC += pa - A2.par; A2.parB = Math.max(A2.parB, A2.parC); } A2.par = pa;
    if (dg > A2.dod) { A2.dodC += dg - A2.dod; A2.dodB = Math.max(A2.dodB, A2.dodC); } A2.dod = dg;
    /* Wucht-Risse, morsche Böden (Laufzähler aus erkundung.js) → dauerhaft */
    const wu = s.wucht || 0, mo = s.morsch || 0;
    if (A2.wu == null || wu < A2.wu) A2.wu = wu; if (A2.mo == null || mo < A2.mo) A2.mo = mo;
    if (wu > A2.wu) { X().wu = (X().wu || 0) + wu - A2.wu; A2.wu = wu; }
    if (mo > A2.mo) { X().mo = (X().mo || 0) + mo - A2.mo; A2.mo = mo; }
    /* Sturzangriff */
    if (P.plunge) A2.plT = run.time || 0;
    /* Kran */
    if (P._kran && !A2.kran) X().kran = (X().kran || 0) + 1; A2.kran = !!P._kran;
    /* Kronleuchter: Griff, Loslassen, Kette ohne Bodenkontakt */
    if ((P._swing || null) !== A2.swCur) { /* undefined ≠ null zählte sonst beim ersten Bild als „losgelassen“ (Fehlvergabe Aus dem Leuchter) */
      if (P._swing) { if (!A2.swGround && A2.swLast && A2.swLast !== P._swing && (run.time || 0) - A2.swRel < 3) { A2.swChain++; if (A2.swChain >= 1) give("f_tarzan"); } else A2.swChain = 0; A2.swLast = P._swing; A2.swGround = false; }
      else A2.swRel = run.time || 0;
      A2.swCur = P._swing || null;
    }
    if (P.onGround) { A2.swGround = true; A2.fassC = 0; }
    /* Bosskampf */
    const b = Z.boss;
    if (b && (!A2.fight || A2.fight.e !== b)) A2.fight = { e: b, id: b.id, warden: !!b.warden, t0: run.time || 0, dmg: 0, done: false };
    if (A2.fight && !A2.fight.done && Z.bossDefeated && Z.boss === A2.fight.e) { A2.fight.done = true; bossWin(A2.fight); }
    if (A2.fight && !b) A2.fight = null;
  }

  /* ======================= LAUFSTART: Held, Umhang, Pakte ======================= */
  const ui = () => Z.ui;
  let sel = null;
  function startModal() {
    const m = M(); sel = sel || { hero: m.heroes[m.hero] ? m.hero : "Z", cape: m.capes[m.cape] ? m.cape : "rot", pacts: (m.pactSel || []).slice(), kit: KITS[m.kit] ? m.kit : "sb" };
    const b = (act, arg, on, lab, dis, sub) => '<button class="wahl' + (on ? " an" : "") + '" data-act="' + act + '" data-arg="' + arg + '"' + (dis ? " disabled" : "") + "><b>" + esc(lab) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</button>";
    const heroes = Object.keys(HEROES).map(k => b("abHero", k, sel.hero === k, L(HEROES[k].n), !m.heroes[k], m.heroes[k] ? L(HEROES[k].d) : "🔒 " + L(HEROES[k].unlock))).join("");
    const capes = Object.keys(CAPES).filter(k => m.capes[k]).map(k => '<button class="umhang' + (sel.cape === k ? " an" : "") + '" data-act="abCape" data-arg="' + k + '" title="' + esc(L(CAPES[k].n)) + '" style="--a:' + CAPES[k].c[0] + ";--b:" + CAPES[k].c[1] + '"></button>').join("");
    const pacts = Object.keys(PACTS).map(k => b("abPact", k, sel.pacts.includes(k), L(PACTS[k].n), false, L(PACTS[k].d))).join("");
    /* Ausrüstung kommt jetzt vom Waffenständer im Lager. Hier nur ein Blick auf die Hände –
       sind sie leer, eine freundliche Warnung mit Schnellwahl (Nundro reicht die Waffen herüber). */
    const P0 = Z.player, hands = P0 && P0.slots ? [P0.slots.a1, P0.slots.a2] : [null, null];
    const hk = a => { const k = inp.device === "touch" ? "" : inp.label(a); return k ? "<kbd>" + esc(k) + "</kbd> " : ""; };
    const handTxt = (it, i) => '<span class="hand' + (it ? "" : " leer") + '">' + hk(i ? "a2" : "a1") + L(i ? ["Hand 2: ", "Hand 2: "] : ["Hand 1: ", "Hand 1: "]) + (it ? '<b style="color:' + (Z.plusCol && it.plus ? Z.plusCol(it.plus) : Z.RARITY[it.rar].col) + '">' + esc(Z.itemTitle ? Z.itemTitle(it) : L(Z.itemDef(it).n)) + "</b>" : "<i>" + L(["leer", "empty"]) + "</i>") + "</span>";
    const empty = !hands[0] && !hands[1], oneEmpty = !hands[0] || !hands[1];
    const kits = oneEmpty || sel.kitUsed ? Object.keys(KITS).map(k => b("abKit", k, sel.kitUsed === k, L(KITS[k].n), false, L(KITS[k].d))).join("") : "";
    const gearHTML = '<div class="haende">' + handTxt(hands[0], 0) + handTxt(hands[1], 1) + "</div>" +
      (empty ? '<p class="warnung">' + L(["Mit leeren Händen? Am Waffenständer vor dem Tor liegen Waffen – oder Nundro reicht dir schnell welche:", "Empty-handed? There are weapons on the rack by the gate – or Nundro quickly hands you some:"]) + "</p>"
        : oneEmpty ? '<p class="hinweis">' + L(["Eine Hand ist noch frei. Schnell auffüllen?", "One hand is still free. Fill it quickly?"]) + "</p>" : "") +
      (kits ? '<div class="wahlen">' + kits + "</div>" : "");
    const n = sel.pacts.length;
    const sk = Z.meta.skullSel || 0;
    ui().open("<h2>" + L(["Die Feste betreten", "Enter the keep"]) + "</h2>" +
      "<h3>" + L(["Held", "Hero"]) + (Z.achTitel && Z.achTitel() ? ' <small class="hinweis">„' + esc(Z.achTitel()) + "“</small>" : "") + '</h3><div class="wahlen">' + heroes + "</div>" +
      "<h3>" + L(["Ausrüstung", "Gear"]) + ' <small class="hinweis">' + L(["Was du in den Händen hältst, nimmst du mit – alles Bessere findest du unterwegs", "What you hold, you take along – anything better you find on the way"]) + "</small></h3>" + gearHTML +
      "<h3>" + L(["Umhang", "Cape"]) + ' <small class="hinweis">' + Object.keys(m.capes).length + "/" + Object.keys(CAPES).length + '</small></h3><div class="umhaenge">' + capes + "</div>" +
      "<h3>" + L(["Pakte", "Pacts"]) + ' <small class="hinweis">' + L(["Jeder Pakt: +30 % Seelensplitter, bessere Beute", "Each pact: +30% soul shards, better loot"]) + (n ? " · " + L(["aktiv: ", "active: "]) + n + " (×" + (1 + 0.3 * n).toFixed(1) + ")" : "") + '</small></h3><div class="wahlen pakte">' + pacts + "</div>" +
      (sk ? '<p class="schaedel">' + "☠".repeat(sk) + " " + L(["Schädel aktiv", "skulls active"]) + "</p>" : "") +
      '<div class="knoepfe"><button data-act="abGo" autofocus>' + L(["Los!", "Go!"]) + '</button><button data-act="abAch">🏆 ' + L(["Erfolge", "Achievements"]) + '</button><button data-act="close">' + L(["Abbrechen", "Cancel"]) + "</button></div>", { cls: "breit" });
  }
  function refocus(sel2) { setTimeout(() => { const el = document.querySelector('#modal [data-arg="' + sel2 + '"]'); if (el) el.focus(); }, 30); }
  function wire() {
    const act = ui().actions;
    act.abHero = k => { if (!M().heroes[k]) return; sel.hero = k; ui().close(); startModal(); refocus(k); };
    act.abCape = k => { sel.cape = k; M().cape = k; applyCape(); ui().close(); startModal(); refocus(k); };
    act.abPact = k => { const i = sel.pacts.indexOf(k); if (i >= 0) sel.pacts.splice(i, 1); else sel.pacts.push(k); ui().close(); startModal(); refocus(k); };
    /* Schnellwahl: legt die Waffen des Pakets in die freien Hände (im Lager) */
    act.abKit = k => {
      sel.kit = k; const kit = KITS[k], P = Z.player;
      const mk = id => (Z.rackItem ? Z.rackItem(id) : Z.makeItem(id, 0, 0));
      if (kit && P && P.slots) {
        if (sel.kitUsed) { P.slots.a1 = mk(kit.a1); P.slots.a2 = mk(kit.a2); }   /* erneut gewählt: beide Hände tauschen */
        else { const ids = [kit.a1, kit.a2].filter(id => !["a1", "a2"].some(s => P.slots[s] && P.slots[s].id === id)); for (const s of ["a1", "a2"]) if (!P.slots[s] && ids.length) P.slots[s] = mk(ids.shift()); }
        sel.kitUsed = k; A.play("unsheathe", { vol: 0.5 });
      }
      ui().close(); startModal(); setTimeout(() => { const el = document.querySelector('#modal [data-act="abGo"]'); if (el) el.focus(); }, 30);
    };
    act.abGo = () => { const m = M(); m.kit = sel.kit; m.hero = sel.hero; m.cape = sel.cape; m.pactSel = sel.pacts.slice(); Z.saveMeta(); ui().close(); Z.startRun(); };
    act.abAch = () => { ui().close(); achModal(true); };
    act.abShrine = b => shrineTake(b);
    act.abTrade = a => trade(a);
    act.abAchBack = arg => { ui().close(); if (arg === "start") startModal(); };
    act.abAchTab = k => { ui().close(); achModal(null, k); setTimeout(() => { const el = document.querySelector('#modal .ach-reiter [data-arg="' + k + '"]'); if (el) el.focus({ preventScroll: true }); }, 40); };
    act.abTitel = id => { const m = M(); if (!m.ach[id]) return; m.titel = m.titel === id ? null : id; Z.saveMeta(); const sc = document.querySelector("#modal .ach2l"), top = sc ? sc.scrollTop : 0; ui().close(); achModal(null); setTimeout(() => { const s2 = document.querySelector("#modal .ach2l"); if (s2) s2.scrollTop = top; const el = document.querySelector('#modal [data-act="abTitel"][data-arg="' + id + '"]'); if (el) el.focus({ preventScroll: true }); }, 40); };
    act.abNix = () => {};
    ui().startRunConfirm = () => { sel = null; startModal(); };
  }
  /* Erfolge-Ansicht: Reiter je Kategorie (LB/RB bzw. Bild↑/↓ wechseln – .reiter aus ui.js), Zeilen als Knöpfe (Pad-Raster),
     Fortschrittsbalken bei zählbaren, freigeschaltete Titel per Klick anlegen. */
  let achTab = "geschichte", achFrom = false;
  const titelOf = id => { const a = getA(id); return a && a.r.titel && M().ach[id] ? L(a.r.titel) : ""; };
  Z.achTitel = () => titelOf(M().titel);
  /* ---- Darstellung (W11 R28, Grafik-Agent): gemalte Siegel je Erfolg (figuren.js Z.siegelURL). Motiv/Stufe aus
     a.siegel bzw. Z.erfolgSiegel(id) (Karten-Agent), sonst geraten aus Kategorie und Stichworten. Nur Bild, keine Logik. ---- */
  const KMOT = { geschichte: "feder", tempo: "sanduhr", kampf: "schwert", makellos: "schild", erkunden: "karte", bosse: "schaedel", sammeln: "truhe", spass: "stern" };
  const WMOT = [[/parade|block|schild/, "schild"], [/ausweich|roll|dodge/, "feder"], [/gold|muenz|reich|geld/, "muenze"], [/rune/, "rune"], [/tagebuch|seite|chronik/, "feder"], [/serie|kette|streak|blitz|schnell|tempo|minute/, "blitz"],
    [/fall|abgrund|sturz|tief/, "pfeil"], [/trank|heil/, "trank"], [/boss|waechter|drache|demogorgon|riese|wraith/, "schaedel"], [/glocke/, "glocke"], [/flut|wasser|see|hafen/, "flamme"], [/feuer|glut|flamm|brand/, "flamme"],
    [/rex|tier|pfote|wendel/, "pfote"], [/faden|weberin|spinne/, "faden"], [/karte|erkund|geheim|raum|tor/, "karte"], [/truhe|schatz|sammler|fund/, "truhe"], [/herz|leben|zaeh|tod/, "herz"], [/auge|schleich|lautlos|ueberrasch/, "auge"],
    [/zahnrad|uhrwerk|kran|hebel/, "zahnrad"], [/krone|alle|ende|sieg/, "krone"], [/zeit|uhr|sanduhr/, "sanduhr"], [/pakt|fluch/, "rune"]];
  function achSiegel(a, ok) {
    if (!Z.siegelURL) return "";
    let w = a.siegel || null; if (!w) { try { w = Z.erfolgSiegel ? Z.erfolgSiegel(a.id) : null; } catch (_) { w = null; } } if (!w || typeof w !== "object") w = {};
    const id = String(a.id || "").toLowerCase(), kat = a.kat || a.c;
    let mot = w.motiv; if (!mot) for (const [re, m] of WMOT) if (re.test(id)) { mot = m; break; } if (!mot) mot = KMOT[kat] || "stern";
    const sel = w.stufe || ({ gewoehnlich: "bronze", selten: "silber", episch: "gold", legendaer: "gold", 1: "bronze", 2: "silber", 3: "gold" })[a.selten] || (kat === "bosse" ? "blut" : a.r && a.r.titel ? "gold" : a.p ? "silber" : "bronze");
    /* Sieg über einen bestimmten Boss: freigeschaltet mit dem gemalten Boss-Porträt (figuren.js) */
    const bm = /^b_([a-zA-Z]+)$/.exec(a.id || ""), bd = bm && Z.BOSSDEF && Z.BOSSDEF[bm[1]];
    if (ok && bd && Z.bossPortraet) { const u = Z.bossPortraet(bd); if (u) return '<img class="ach-siegel boss" alt="" src="' + u + '">'; }
    return '<img class="ach-siegel" alt="" src="' + Z.siegelURL(mot, ok ? { stufe: sel, band: sel === "gold" || sel === "blut" } : { gesperrt: true }) + '">';
  }
  /* für die Freischalt-Einblendung (ui.js): Erfolg am Namen im Meldungstext erkennen */
  Z.achSiegelInfo = function (html) { try { const t = String(html || ""); const a = ACH.find(x => t.includes(esc(L(x.n)))); if (!a) return null; const m = /src="([^"]+)"/.exec(achSiegel(a, true)); return m ? { url: m[1] } : null; } catch (_) { return null; } };
  function achModal(fromStart, tab) {
    buildDyn(); achCss();
    if (fromStart != null) achFrom = !!fromStart; if (tab && KAT.some(k => k.id === tab)) achTab = tab;
    const m = M(), done = ACH.filter(a => m.ach[a.id]).length;
    const tabs = '<div class="reiter ach-reiter">' + KAT.map(k => { const l = ACH.filter(a => a.c === k.id), d = l.filter(a => m.ach[a.id]).length;
      const ki = Z.siegelURL ? '<img class="ach-reiter-siegel" alt="" src="' + Z.siegelURL(KMOT[k.id] || "stern", d === l.length && l.length ? { stufe: "gold" } : { stufe: "bronze" }) + '">' : k.i + " ";
      return '<button data-act="abAchTab" data-arg="' + k.id + '" class="' + (k.id === achTab ? "an" : "") + '">' + ki + esc(L(k.n)) + " <small>" + d + "/" + l.length + "</small></button>"; }).join("") + "</div>";
    const rows = ACH.filter(a => a.c === achTab).map(a => {
      const ok = !!m.ach[a.id]; let bar = "";
      if (a.p && !ok) { let p = null; try { p = a.p(); } catch (_) {} if (p && p[1] > 0) { const v = Math.max(0, Math.min(p[0], p[1])); bar = '<i class="ach-balken"><i style="width:' + Math.round(v / p[1] * 100) + '%"></i></i><em class="ach-zahl">' + U.fmt(Math.floor(v)) + " / " + U.fmt(p[1]) + "</em>"; } }
      const tit = ok && a.r.titel, an = tit && m.titel === a.id;
      return '<button class="erfolg ach2' + (ok ? " ja" : "") + (a.selten ? " selten" : "") + (an ? " titel-an" : "") + '"' + (tit ? ' data-act="abTitel" data-arg="' + a.id + '"' : ' data-act="abNix"') + ">" + achSiegel(a, ok) + '<div class="ach-text"><b>' + esc(L(a.n)) + "</b><span>" + esc(L(a.d)) + "</span>" + bar + "<small>" + esc(rewardText(a.r)) + (tit ? (an ? L([" · getragen", " · worn"]) : L([" · anlegen", " · wear"])) : "") + "</small></div></button>";
    }).join("");
    const runes = ["tiefe", "glut", "himmel"].map(k => (m.runes[k] ? "◆" : "◇")).join(" ");
    const tt = titelOf(m.titel);
    ui().open("<h2>" + L(["Erfolge", "Achievements"]) + " <small>" + done + "/" + ACH.length + (tt ? " · „" + esc(tt) + "“" : "") + "</small></h2>" + tabs +
      (achTab === "erkunden" ? '<p class="hinweis">' + L(["Runen-Fragmente: ", "Rune fragments: "]) + runes + " · " + L(["versteckt in Geheimräumen der Verliese, der Schmiede und der Zinnen", "hidden in secret rooms of the dungeons, the forge and the spires"]) + "</p>" : "") +
      (achTab === "tempo" || achTab === "makellos" ? '<p class="hinweis">' + L(["Unter Barmherzigkeit zählen Tempo- und Makellos-Erfolge nicht.", "Speed and flawless achievements don't count under Mercy."]) + "</p>" : "") +
      '<div class="erfolge ach2l">' + rows + '</div><div class="knoepfe"><button data-act="abAchBack" data-arg="' + (achFrom ? "start" : "") + '">' + L(["Zurück", "Back"]) + "</button></div>", { cls: "breit" });
  }
  Z.achModal = achModal;
  function achCss() {
    if (document.getElementById("ach2css")) return;
    const st = document.createElement("style"); st.id = "ach2css";
    st.textContent = ".erfolge.ach2l{grid-template-columns:repeat(auto-fill,minmax(250px,1fr));max-height:min(62vh,900px);overflow:auto;padding:2px}" +
      "button.erfolg.ach2{font:inherit;color:var(--text);text-align:left;background:linear-gradient(#2a1e1a,#1c1412);cursor:pointer;align-items:stretch}" +
      "button.erfolg.ach2:focus,button.erfolg.ach2:hover{outline:none;border-color:var(--gold);opacity:1;filter:none;box-shadow:0 0 12px rgba(229,180,84,.25)}" +
      "button.erfolg.titel-an{box-shadow:inset 0 0 0 1px var(--gold);background:linear-gradient(#3a2618,#22160e)}" +
      ".ach-balken{display:block;height:6px;margin:4px 0 1px;background:#140e0c;border:1px solid #3a2a24;border-radius:4px;overflow:hidden}" +
      ".ach-balken i{display:block;height:100%;background:linear-gradient(90deg,#8a1414,#e5b454)}" +
      ".ach-zahl{font-style:normal;font-size:var(--fs-xs,11px);color:#c8b090}" +
      ".ach-reiter button small{opacity:.75;font-weight:400}" +
      "@media (min-width:2200px){.erfolge.ach2l{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}.erfolg.ach2 span{font-size:14px}}" +
      /* W11 R28 (Grafik): Siegel links, Text rechts; Balken als eiserne Rinne mit Glut; gesperrte Karten gedämpft; Reiter mit kleinen Siegeln */
      "button.erfolg.ach2{display:flex;flex-direction:row;gap:10px;align-items:center;padding:8px 10px;border:1px solid #3a2a24;border-radius:8px;position:relative}" +
      "button.erfolg.ach2 .ach-text{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}" +
      "button.erfolg.ach2 b{font-family:var(--fd);font-weight:400;font-size:var(--fs-m,15px);color:#f0dcc0;letter-spacing:.02em}" +
      "button.erfolg.ach2.ja b{color:var(--gold)}" +
      "button.erfolg.ach2:not(.ja){background:linear-gradient(#1e1614,#141010)}button.erfolg.ach2:not(.ja) b{color:#b8a898}button.erfolg.ach2:not(.ja) span{color:#a89888}" +
      "button.erfolg.ach2.ja{background:radial-gradient(circle at 34px 50%,rgba(229,180,84,.13),rgba(0,0,0,0) 60px),linear-gradient(#2c1f1a,#1c1412);border-color:#5a4430}" +
      ".ach-siegel{width:52px;height:52px;flex:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.7))}" +
      "button.erfolg.ach2:not(.ja) .ach-siegel{opacity:.8}" +
      "button.erfolg.ach2.ja:hover .ach-siegel,button.erfolg.ach2.ja:focus .ach-siegel{transform:rotate(-6deg) scale(1.06);transition:transform .2s}" +
      ".ach-balken{height:8px!important;margin:5px 0 2px!important;background:linear-gradient(#0c0708,#1c1012)!important;border:1px solid #000!important;border-radius:3px!important;box-shadow:0 0 0 1px var(--eisen3,#4a3a34),inset 0 1px 3px rgba(0,0,0,.7);position:relative}" +
      ".ach-balken i{background:linear-gradient(#ffc070,#d06a1e 50%,#7a2a10)!important;box-shadow:inset 0 1px 0 rgba(255,230,180,.45),1px 0 5px rgba(255,140,50,.5)}" +
      ".ach-zahl{font-variant-numeric:tabular-nums}" +
      ".ach-reiter{flex-wrap:wrap}.ach-reiter button{display:inline-flex;align-items:center;gap:5px}.ach-reiter-siegel{width:22px;height:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}" +
      ".handheld .ach-siegel{width:44px;height:44px}.handheld .ach-reiter-siegel{width:18px;height:18px}" +
      "button.erfolg.ach2.selten.ja{border-color:#7a2a1c;background:radial-gradient(circle at 34px 50%,rgba(220,70,40,.2),rgba(0,0,0,0) 62px),linear-gradient(#2e1a16,#1c1210)}" +
      "button.erfolg.ach2.selten b::after{content:' ◆';color:#d0503a;font-size:.8em}" +
      /* Liste unter dem UI-Zoom (UWQHD: --ui 2) nicht höher als der Bildschirm, damit „Zurück“ sichtbar bleibt */
      ".erfolge.ach2l{max-height:min(calc(54vh / var(--ui,1)),900px)!important}" +
      "@media (min-width:2200px){.ach-siegel{width:64px;height:64px}}";
    document.head.appendChild(st);
  }

  /* Lauf beginnt: Held, Pakte, Boni anwenden */
  const start0 = Z.startRun;
  Z.startRun = function () {
    start0.apply(this, arguments);
    const m = M(), run = Z.run, P = Z.player;
    run.pacts = (m.pactSel || []).slice(); run.hero = m.heroes[m.hero] ? m.hero : "Z";
    Z.recalcPlayer(); P.hp = P.hpMax;
    if (pact("durst")) { P.potions = 0; P.potMax = 0; }
    if (m.bonus.trank && !pact("durst")) { P.potMax++; P.potions++; }
    run.heroGiven = false; run.events = 0;
    Z.stats.dives = 0;
  };
  const recalc0 = Z.recalcPlayer;
  Z.recalcPlayer = function () {
    recalc0.apply(this, arguments);
    const P = Z.player; if (!P || !Z.run) return;
    let f = 1; if (pact("glas")) f *= 0.65; if (Z.run.hero === "G") f *= 0.9;
    const add = M().bonus.leben ? 10 : 0;
    if (f !== 1 || add) { const r = P.hp / P.hpMax; P.hpMax = Math.round(P.hpMax * f + add); P.hp = Math.min(P.hpMax, Math.max(1, Math.round(P.hpMax * r))); }
  };
  /* Gegner unter Pakten */
  const spawn0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id, x, y, o) {
    o = o || {};
    if (pact("elite") && !o.elite && Z.R() < 0.25 && Z.ENEMIES[id] && !Z.ENEMIES[id].boss) o = Object.assign({}, o, { elite: true });
    if (varAktiv("brut") && !o.elite && Z.R() < VARIANTEN.brut.elite && Z.ENEMIES[id] && !Z.ENEMIES[id].boss && !/^mb_/.test(id)) o = Object.assign({}, o, { elite: true });
    const e = spawn0(id, x, y, o);
    if (e && !e.def.boss) {
      if (pact("raserei")) e.def = Object.assign({}, e.def, { spd: (e.def.spd || 80) * 1.3 });
      if (pact("blutzoll")) e.dmgMul *= 1.5;
    }
    if (e && e.def.boss && pact("blutzoll")) e.dmgMul *= 1.25;
    if (e && !e.def.boss && varAktiv("gold")) e.dmgMul *= VARIANTEN.gold.dmg;
    return e;
  };
  const roll0 = Z.rollItem;
  Z.rollItem = function (o) { o = Object.assign({}, o || {}); const n = npacts() + (Z.gebietVariante() ? 1 : 0); /* Variante: Beute wie ein Pakt mehr */ if (n) { const r = (o.rar || [70, 24, 5, 1]).slice(); r[0] /= 1 + 0.35 * n; r[2] *= 1 + 0.2 * n; r[3] *= 1 + 0.25 * n; o.rar = r; } return roll0(o); };

  /* ======================= Laufender Lauf: Helden-Kräfte, Pakt-Wirkungen ======================= */
  let prev = null;
  function heroTick(dt) {
    const P = Z.player, run = Z.run; if (!P || !run) return;
    if (!prev || prev.P !== P) prev = { P, gold: P.gold, shards: P.shards, cd: { s1: P.cd.s1, s2: P.cd.s2 }, insp: 12 };
    const h = run.hero;
    if (!run.heroGiven && Z.level && !Z.level.hub) {
      run.heroGiven = true;
      const give = (id, slot) => { const it = Z.makeItem(id, 0, 1); P.slots[slot] = it; Z.meta.found[id] = true; };
      /* Wer mit ganz leeren Händen losgeht (oder direkt startet), bekommt das gewohnte Paket – nie mit bloßen Fäusten in die Feste */
      const kit = KITS[M().kit] || KITS.sb;
      if (!P.slots.a1 && !P.slots.a2) {
        P.slots.a1 = Z.rackItem ? Z.rackItem(kit.a1) : Z.makeItem(kit.a1, 0, 0); P.slots.a2 = Z.rackItem ? Z.rackItem(kit.a2) : Z.makeItem(kit.a2, 0, 0);
        if (run.fromHub) setTimeout(() => Z.toast && Z.toast(L(["Nundro hat dir hinterhergerufen und ", "Nundro called after you and threw you "]) + "<b>" + esc(L(Z.WEAPONS[kit.a1].n)) + "</b>" + L([" und ", " and "]) + "<b>" + esc(L(Z.WEAPONS[kit.a2].n)) + "</b>" + L([" zugeworfen.", "."]), 3600), 1600);
      }
      if (h === "G" && (!P.slots.a2 || Z.WEAPONS[P.slots.a2.id].find == null)) give("bogen", "a2"); if (h === "B") give("spottlied", "s1"); if (h === "E") give("echoblitz", "s1");
      if (M().bonus.startwaffe) { const ids = Object.keys(Z.meta.found || {}).filter(id => Z.WEAPONS[id] && Z.WEAPONS[id].kind && id !== "faeuste" && !Z.WEAPONS[id].legendaryOnly); if (ids.length && (!P.slots.a1 || Z.WEAPONS[P.slots.a1.id].find == null)) give(Z.R.pick(ids), "a1"); }
    }
    if (h === "G" && P.onGround) P.airJumps = 2;
    if (h === "E" && !P.onGround && inp.held.jump && P.vy > 70 && !P.plunge && !P.climbing) { P.vy = 70; if (Math.random() < dt * 20) FX.p({ x: P.x + P.w / 2 + (Math.random() - 0.5) * 16, y: P.y + 6, vx: 0, vy: 20, life: 0.6, size: 2, col: "#e8e0d0", kind: "leaf", vr: 3 }); }
    if (h === "B") { prev.insp -= dt; if (prev.insp <= 0) { prev.insp = 12; P.st.dance = 4; FX.text(P.x + P.w / 2, P.y - 12, "♪ " + L(["Inspiration!", "Inspiration!"]), "#ffc24a", true); A.play("laugh", { vol: 0.3, rate: 1.3 }); FX.ring(P.x + P.w / 2, P.y + 12, 30, "#ffc24a", 0.4, 2); } }
    const dg = P.gold - prev.gold;
    if (dg > 0) { if (varAktiv("gold")) P.gold += Math.round(dg * VARIANTEN.gold.gold); if (h === "B") P.gold += Math.round(dg * 0.5); if (h === "E") Z.healPlayer(Math.max(1, dg * 0.08)); M().totalGold += dg; }
    prev.gold = P.gold;
    const ds = P.shards - prev.shards; if (ds > 0 && npacts()) P.shards += Math.round(ds * 0.3 * npacts()); prev.shards = P.shards;
    for (const k of ["s1", "s2"]) { if (P.cd[k] > prev.cd[k] + 0.3 && pact("ungeduld")) P.cd[k] *= 1.5; prev.cd[k] = P.cd[k]; }
  }
  /* Pfeile von Friedrich härter */
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) { o = o || {}; if (Z.run && Z.run.hero === "G" && o.src === "ranged" && !o.dot) dmg *= 1.2; return hit0(e, dmg, o); };
  /* Tode zählen, Sturzangriffe zählen */
  const death0 = Z.onPlayerDeath;
  Z.onPlayerDeath = function () { if (Z.player && Z.player.dead) return; M().deaths = (M().deaths || 0) + 1; return death0.apply(this, arguments); };
  const dive0 = Z.diveStart;
  if (dive0) Z.diveStart = function () { const r = dive0.apply(this, arguments); if (r && Z.stats) Z.stats.dives = (Z.stats.dives || 0) + 1; return r; };

  /* ======================= Spielfigur der Gefährten ======================= */
  const draw0 = Z.drawPlayer;
  Z.drawPlayer = function (c, P, t) {
    const h = Z.run && Z.run.hero;
    if (!h || h === "Z" || P !== Z.player || !Z.level || Z.level.hub) return draw0(c, P, t);
    const cx = P.x + P.w / 2, fy = P.y + P.h;
    c.save();
    c.globalAlpha = P.invis > 0 ? 0.3 : P.iframe > 0 && P.hurtT <= 0 && P.rollT <= 0 && Math.floor(t * 20) % 2 === 0 && P.iframe < 0.7 ? 0.5 : 1;
    if (P.rollT > 0) { c.translate(cx, fy - 10); c.rotate((1 - P.rollT / Z.PC.ROLL) * Math.PI * 2 * P.face); c.translate(-cx, -(fy - 10)); }
    const sc = P.crouch ? [1.1, 0.66] : [1.05, 1.05];
    c.translate(cx, fy); c.scale(sc[0], sc[1]);
    const lean = P.act && P.act.type === "melee" && P.act.phase === "act" ? 0.18 * P.face : 0; c.rotate(lean);
    Z.drawNPC(c, h === "G" ? "G" : h === "B" ? "B" : "E", 0, 0, t * (Math.abs(P.vx) > 20 ? 3 : 1), P.face);
    c.restore();
    /* Waffe in der Hand beim Angriff */
    if (P.act && P.act.d && (P.act.type === "melee" || P.act.type === "shield" || P.act.type === "shot" || P.act.type === "charge")) {
      c.save(); c.translate(cx + P.face * 5, P.y + 12); c.scale(P.face, 1); c.rotate(P.act.type === "melee" ? (P.act.phase === "pre" ? -1 : 0.6) : 0); Z.drawWeapon(c, P.act.d.icon, P.act.d.col, t, 0); c.restore();
    }
  };

  /* ======================= RAUM-EREIGNISSE ======================= */
  let evs = [];
  const EVN = { haendler: ["Fahrende Händlerin", "Wandering Trader"], schrein: ["Verfluchter Schrein", "Cursed Shrine"], brunnen: ["Wunschbrunnen", "Wishing Well"], wette: ["Barradins Wette", "Barradin's Bet"], kaefig: ["Gefangener im Käfig", "Caged Prisoner"], dieb: ["Goldgoblin", "Gold Goblin"] };
  function spotFar(lv, from, n) {
    for (let i = 0; i < 400; i++) { const x = 3 + ((Math.random() * (lv.W - 6)) | 0), y = 3 + ((Math.random() * (lv.H - 6)) | 0); if (Z.standable(lv, x, y, 3) && Z.standable(lv, x - 1, y, 3) && Z.standable(lv, x + 1, y, 3) && Math.abs(x - from.x) + Math.abs(y - from.y) > (n || 30) && !(lv.doors || []).some(d => Math.abs(d.x - x) < 5 && Math.abs(d.y - y) < 4)) return { x, y }; }
    return null;
  }
  function setupEvents(lv) {
    evs = []; Z.abEvents = evs;
    if (lv && lv.arena && Z.ARENAS[lv.arena] && Z.ARENAS[lv.arena].final && M().bonus.riss) lv.riftPending = true;
    if (!lv || lv.hub || lv.arena || lv.passage || !Z.run) return;
    const n = (Math.random() < 0.65 ? 1 : 0) + (Math.random() < (M().bonus.glueck ? 0.5 : 0.22) ? 1 : 0);
    const kinds = ["brunnen", "wette", "kaefig", "dieb"];
    /* Händlerin und Schrein mit „Mitleidszähler“: ca. jedes 2.–3. Gebiet, spätestens nach drei Gebieten ohne */
    const run = Z.run, plan = [];
    run.sinceTrader = (run.sinceTrader || 0) + 1; run.sinceShrine = (run.sinceShrine || 0) + 1;
    if (Math.random() < 0.1 + 0.18 * run.sinceTrader || run.sinceTrader >= 3) { plan.push("haendler"); run.sinceTrader = 0; }
    if (Math.random() < 0.05 + 0.15 * run.sinceShrine || run.sinceShrine >= 4) { plan.push("schrein"); run.sinceShrine = 0; }
    for (let i = 0; i < n; i++) plan.push(Z.R.pick(kinds));
    if (varAktiv("gold") && !plan.includes("dieb")) plan.push("dieb");
    for (const k of plan) {
      const p = spotFar(lv, lv.start, k === "haendler" ? 18 : 30); if (!p) continue;
      const x = p.x * T + 8, y = (p.y + 1) * T;
      if (k === "dieb") { const e = Z.spawnEnemy("goblin", x, y); if (e) { e.thief = true; e.hpMax = e.hp = Math.round(e.hpMax * 2.5); e.def = Object.assign({}, e.def, { spd: 135, atks: [] }); e.t0 = 0; evs.push({ k, e, x, y, done: false }); } }
      else evs.push({ k, x, y, done: false, t: 0 });
    }
    /* W13: seltene Zeitrennen-Kammer (Sanduhr-Sockel, Ringe in der Nähe einsammeln) */
    if (Math.random() < (Z.rennenChance != null ? Z.rennenChance : 0.14)) { try { const ev = setupRennen(lv); if (ev) { evs.push(ev); rennenInteract(ev); } } catch (err) { console.error(err); } }
    /* W13 R13: lange Nebenketten beleben (leere Enden → Fundstelle, lange Ketten → Vorratsnische) */
    if (Z.kettenAn !== false) { try { setupKetten(lv); } catch (err) { console.error(err); } }
    /* W13 R11: Heilquelle an einer Kreuzung des Hauptwegs (Stufe 1–3): jetzt trinken oder Flasche füllen */
    if (Math.random() < (Z.quelleChance != null ? Z.quelleChance : QUELLE.chance(lv))) { try { const ev = setupQuelle(lv); if (ev) { evs.push(ev); quelleInteract(ev); } } catch (err) { console.error(err); } }
    /* W13 R9: Hebelrätsel in einem Geheimraum (nie auf dem Hauptweg) */
    if (Math.random() < (Z.raetselChance != null ? Z.raetselChance : 0.45)) { try { const ev = setupRaetsel(lv); if (ev) { evs.push(ev); raetselInteract(ev); } } catch (err) { console.error(err); } }
    if (evs.some(e => e.k === "haendler")) setTimeout(() => { if (Z.level === lv && Z.ui && Z.ui.notify) Z.ui.notify("⚖ <b>" + L(["Fahrende Händlerin", "Wandering Trader"]) + "</b><br><small>" + L(["Irgendwo klimpert ihr Karren – folge der Laterne (Karte).", "Her cart is jingling somewhere – follow the lantern (map)."]) + "</small>", { prio: 2, art: "gold", dauer: 3400 }); }, 9000);
    /* Runen-Fragmente in Geheimräumen */
    const RUNE = { verlies: "tiefe", schmiede: "glut", zinnen: "himmel" };
    const rk = RUNE[lv.biome];
    if (rk && !M().runes[rk]) {
      let cell = null; for (const key in lv.cells) if (lv.cells[key].kind === "secret") { cell = lv.cells[key]; break; }
      if (!cell) for (const key in lv.cells) if (lv.cells[key].kind === "side") { cell = lv.cells[key]; break; }
      if (cell) { for (let i = 0; i < 300; i++) { const x = cell.x * Z.CW + 2 + ((Math.random() * (Z.CW - 4)) | 0), y = cell.y * Z.CH + 2 + ((Math.random() * (Z.CH - 4)) | 0); if (Z.standable(lv, x, y, 2)) { evs.push({ k: "rune", rk, x: x * T + 8, y: (y + 1) * T, done: false, t: 0 }); break; } } }
    }
    /* Riss im Netz nach einem Endboss */
    if (lv.arena && Z.ARENAS[lv.arena] && Z.ARENAS[lv.arena].final && M().bonus.riss) lv.riftPending = true;
  }
  const load0 = Z.loadArea;
  Z.loadArea = function (id) { try { varWahl(id); } catch (err) { console.error(err); } const r = load0.apply(this, arguments); try { varAnsage(); } catch (err) { console.error(err); } try { setupEvents(Z.level); } catch (err) { console.error(err); } return r; };
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "abenteuer", save: () => evs, load: s => { evs = s || []; Z.abEvents = evs; } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */
  function near(ev, d) { const P = Z.player; return P && Math.abs(P.x + P.w / 2 - ev.x) < (d || 22) && Math.abs(P.y + P.h - ev.y) < 26; }
  function finish(ev) { ev.done = true; M().events = (M().events || 0) + 1; if (Z.run) Z.run.events++; Z.saveMeta(); }
  /* ======================= ZEITRENNEN ======================= */
  /* Sockel mit Sanduhr; Benutzen startet die Uhr, 5 goldene Ringe liegen in Reichweite (gleiche oder Nachbarzellen, keine Geheimräume).
     Zeit = Kachelweg (Dijkstra über die Prüferkanten) / Laufgeschwindigkeit × 1,15 + 2 s (per Bot geeicht: ~25 % Restzeit). Scheitern kostet nichts – bis zu 3 Versuche. */
  /* Wegkosten über die echten Kachelkanten des Erreichbarkeitsprüfers (welt.js validate): Dijkstra je Teilstück.
     Kosten in „Laufkacheln“: waagrecht 1, hinauf 1,7 je Kachel (Sprung/Leiter), hinab 0,5 je Kachel. */
  function rennenGraph(lv, p) {
    const f = { W: lv.W, H: lv.H, get: lv.get, start: { x: p.x, y: p.y }, doors: [], cells: lv.cells, _wantEdges: true };
    Z.validateLevel(f); const [ea, eb] = f._edges || [[], []], N = lv.W * lv.H, W = lv.W;
    const head = new Int32Array(N).fill(-1), nxt = new Int32Array(ea.length), cost = new Float64Array(ea.length);
    for (let k = 0; k < ea.length; k++) { nxt[k] = head[ea[k]]; head[ea[k]] = k; const dx = Math.abs((ea[k] % W) - (eb[k] % W)), dy = ((eb[k] / W) | 0) - ((ea[k] / W) | 0); cost[k] = Math.max(dx, 0.3) + (dy < 0 ? -dy * 1.7 : dy * 0.5); }
    const dist = src => {
      const d = new Float64Array(N).fill(1e9), hc = [], hv = []; d[src] = 0;
      const up = (c, v) => { let i = hc.length; hc.push(c); hv.push(v); while (i > 0) { const q = (i - 1) >> 1; if (hc[q] <= hc[i]) break; [hc[q], hc[i]] = [hc[i], hc[q]]; [hv[q], hv[i]] = [hv[i], hv[q]]; i = q; } };
      const down = () => { const c = hc[0], v = hv[0], lc = hc.pop(), lv2 = hv.pop(); if (hc.length) { hc[0] = lc; hv[0] = lv2; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < hc.length && hc[l] < hc[m]) m = l; if (r < hc.length && hc[r] < hc[m]) m = r; if (m === i) break; [hc[m], hc[i]] = [hc[i], hc[m]]; [hv[m], hv[i]] = [hv[i], hv[m]]; i = m; } } return [c, v]; };
      up(0, src);
      while (hc.length) {
        const [c, u] = down(); if (c > d[u]) continue; if (c > 200) break;
        for (let e = head[u]; e >= 0; e = nxt[e]) { const v = eb[e], nc = c + cost[e]; if (nc < d[v]) { d[v] = nc; up(nc, v); } }
      }
      return d;
    };
    return { reach: f.reach, dist };
  }
  Z.rennenFaktor = 1;
  function setupRennen(lv) {
    const p = spotFar(lv, lv.start, 24); if (!p) return null;
    const cellOf = (x, y) => lv.cells && lv.cells[Math.floor(x / Z.CW) + "," + Math.floor(y / Z.CH)];
    const c0 = cellOf(p.x, p.y); if (!c0 || c0.kind === "secret" || (lv.reach && !lv.reach[p.y * lv.W + p.x])) return null;
    const G = rennenGraph(lv, p), W = lv.W;
    const d0 = G.dist(p.y * W + p.x);
    const cand = [];
    for (let i = 0; i < 900 && cand.length < 60; i++) {
      const x = p.x - 22 + ((Math.random() * 45) | 0), y = p.y - 9 + ((Math.random() * 16) | 0);
      if (x < 2 || y < 2 || x >= lv.W - 2 || y >= lv.H - 2) continue;
      const c = cellOf(x, y); if (!c || c.kind === "secret") continue;
      if (Math.abs(x - p.x) + Math.abs(y - p.y) < 6 || !Z.standable(lv, x, y, 2) || d0[y * W + x] > 60) continue; /* vom Sockel erreichbar, nicht zu weit */
      if ((lv.doors || []).some(d => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 3)) continue;
      cand.push({ x, y });
    }
    const rings = [];
    for (const q of cand) { if (rings.length >= 5) break; if (rings.every(r => Math.abs(r.x - q.x) + Math.abs(r.y - q.y) >= 6)) rings.push(q); }
    if (rings.length < 4) return null;
    /* echte Reihenfolge: jeweils der nächste Ring auf dem Kachelweg */
    let cur = p, dc = d0, left = rings.slice(), way = 0; const order = [];
    while (left.length) {
      let bi = -1, bd = 1e9; left.forEach((r, i) => { const v = dc[r.y * W + r.x]; if (v < bd) { bd = v; bi = i; } });
      if (bi < 0 || bd >= 1e8) return null; /* ein Ring wäre von hier nicht erreichbar */
      way += bd; cur = left.splice(bi, 1)[0]; order.push(cur); if (left.length) dc = G.dist(cur.y * W + cur.x);
    }
    const limit = Math.max(8, Math.round((way * T / Z.PC.RUN * 1.15 + 2) * Z.rennenFaktor)); /* Bot (R8): braucht im Mittel 1,03 × Weg/Laufen → ~25 % Rest */
    return { k: "rennen", x: p.x * T + 8, y: (p.y + 1) * T, done: false, t: 0, on: false, tries: 0, limit, way: Math.round(way), rings: order.map(r => ({ x: r.x * T + 8, y: r.y * T + 4, got: false })) };
  }
  /* ======================= NEBENKETTEN (W13 R13) ======================= */
  /* Messung (r13/ketten2.py, 13 Gebiete × 5): 243 Nebenketten mit ≥ 3 Räumen, davon 62 (26 %) ohne jede Belohnung und ohne Geheimkammer –
     man läuft 3–7 Räume weit für nichts. Jetzt:
       · leeres Kettenende (≥ 3 Räume, nirgends ein Fund, keine Geheimkammer dahinter) → „Überreste eines Abenteurers“ zum Durchsuchen,
         mit leisem Goldschimmer (von Weitem sichtbar: das Ende lohnt sich)
       · Ketten ab 4 Räumen → in der Mitte eine Vorratsnische (2–3 zerbrechliche Kisten/Töpfe, normale Kistenbeute)
     Keine zusätzlichen Gegner. Werte (FUND) als Vorschlag für Balance. */
  const FUND = { gold: t => 20 + 10 * t, essen: 0.35, rolle: 0.1, glut: 0.4 };
  Z.FUND = FUND;
  /* W13 R18: Joris „Funkenschlag“ (Lager-Zusatz): Überreste geben mit 40 % ein Stück Schmiedeglut, gelöste Hebelrätsel immer */
  const joriFunken = sicher => !!(Z.lager && Z.lager.level && Z.lager.level("jori", "funken") >= 1) && (sicher || Math.random() < FUND.glut);
  function setupKetten(lv) {
    if (!lv || !lv.cells || lv.hub || lv.arena || lv.passage) return;
    const cells = Object.keys(lv.cells).map(k => lv.cells[k]), kids = new Map(), key = c => c.x + "," + c.y;
    for (const c of cells) if (c.parent) { if (!kids.has(c.parent)) kids.set(c.parent, []); kids.get(c.parent).push(c); }
    const rew = new Set((lv.rewards || []).map(r => r.cell));
    const walk = x => { const ks = (kids.get(x) || []).filter(k => k.kind === "side"); if (!ks.length) return [[x]]; const out = []; for (const k of ks) for (const pth of walk(k)) out.push([x].concat(pth)); return out; };
    const leaves = new Set(), mids = new Set();
    for (const c of cells) {
      if (c.kind !== "side" || !c.parent || c.parent.kind !== "path") continue;
      for (const ch of walk(c)) {
        if (ch.length < 3) continue;
        const leaf = ch[ch.length - 1], secretBehind = (kids.get(leaf) || []).some(k => k.kind === "secret");
        if (!ch.some(x => rew.has(key(x))) && !secretBehind) leaves.add(leaf);
        if (ch.length >= 4) mids.add(ch[Math.floor(ch.length / 2)]);
      }
    }
    const W = lv.W;
    const spots = (c, wide) => { const sp = []; for (let y = c.y * Z.CH + 1; y < c.y * Z.CH + Z.CH - 1; y++) for (let x = c.x * Z.CW + 2; x < c.x * Z.CW + Z.CW - 2; x++) {
      if (!Z.standable(lv, x, y, 2) || (lv.reach && !lv.reach[y * W + x]) || (lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3)) continue;
      if (wide && !(Z.standable(lv, x + 1, y, 2) && Z.standable(lv, x + 2, y, 2) && lv.get(x + 1, y + 1) === lv.get(x, y + 1) && lv.get(x + 2, y + 1) === lv.get(x, y + 1))) continue;
      if (Z.propsLive.some(p => Math.abs(p.x - x * T) < 40 && Math.abs(p.y - y * T) < 24) || evs.some(e => Math.abs(e.x - x * T) < 48 && Math.abs(e.y - (y + 1) * T) < 32)) continue;
      sp.push([x, y]); } return sp; };
    for (const c of leaves) {
      /* tief im Raum: weit weg vom Elternraum */
      const sp = spots(c, false); if (!sp.length) continue;
      const px = c.parent.x * Z.CW + Z.CW / 2, py = c.parent.y * Z.CH + Z.CH / 2;
      sp.sort((a, b) => Math.hypot(b[0] - px, b[1] - py) - Math.hypot(a[0] - px, a[1] - py));
      const [x, y] = sp[0]; evs.push({ k: "fund", x: x * T + 8, y: (y + 1) * T, done: false, t: Math.random() * 9, cell: key(c) }); fundInteract(evs[evs.length - 1]);
    }
    for (const c of mids) {
      const sp = spots(c, true); if (!sp.length) continue;
      const [x, y] = sp[(Math.random() * sp.length) | 0], n = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < n; i++) Z.propsLive.push({ kind: "breakable", style: Z.R.pick(["crate", "pot", "barrel"]), x: (x + i) * T + 1, y: y * T + 2, w: 14, h: 14, hp: 1, nische: true });
    }
  }
  const FUNDTXT = [["Ein Rucksack, halb vermodert. Darin klimpert es.", "A backpack, half rotten. Something clinks inside."], ["Jemand ist hier nicht weitergekommen. Seine Taschen schon.", "Someone didn't get any further. Their pockets did."],
    ["Eine Feldflasche, ein Messer, ein paar Münzen – und eine Karte, die genau hierher führt.", "A canteen, a knife, a few coins – and a map that leads exactly here."], ["Ein Lager in der Sackgasse. Die Asche ist kalt.", "A camp in the dead end. The ashes are cold."]];
  function fundInteract(ev) {
    (Z.interacts = Z.interacts || []).push({ x: ev.x, y: ev.y, r: 22, h: 34, ok: () => !ev.done, label: () => L(["Durchsuchen", "Search"]), use: () => fundNimm(ev) });
  }
  function fundNimm(ev) {
    const P = Z.player; if (ev.done || !P) return; ev.done = true; finish(ev);
    const t = Z.run ? Z.run.tier : 0, g = Math.round(FUND.gold(t));
    A.play("coin", { vol: 0.5, x: ev.x }); for (let i = 0; i < 5; i++) Z.spawnPickup("gold", ev.x, ev.y - 8, { n: Math.ceil(g / 5), vx: (Math.random() - 0.5) * 120, vy: -150 - Math.random() * 80 });
    if (Math.random() < FUND.essen && Z.FOOD) Z.spawnPickup("food", ev.x + 6, ev.y - 6, { food: Z.R.pick(Z.FOOD), drop: true });
    if (Math.random() < FUND.rolle) Z.spawnPickup("scroll", ev.x - 6, ev.y - 6, { vx: 0, vy: -140, stat: Z.R.pick(["brut", "takt", "ueber"]) });
    Z.toast(L(Z.R.pick(FUNDTXT)), 3000);
    if (joriFunken()) { Z.spawnReward ? Z.spawnReward("glut", ev.x, ev.y - 10, { n: 1 }) : null; FX.text(ev.x, ev.y - 24, L(["Jori: „Da glimmt noch was!“", "Jori: \"Something's still glowing!\""]), "#ff9a5a"); }
    X().funde = (X().funde || 0) + 1;
  }
  function drawFund(c, ev, t) {
    if (Z.fundGemalt && Z.fundGemalt(c, ev, t)) return;
    const x = ev.x, y = ev.y;
    /* Rucksack und Knochen; solange undurchsucht ein leiser Goldschimmer */
    if (!ev.done) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 6, 16 + Math.sin(t * 2 + ev.t) * 2, "rgba(255,200,110,.22)"); c.restore(); }
    c.fillStyle = "#e0d6c0"; c.fillRect(x - 9, y - 2, 7, 2); circ(c, x - 10, y - 4, 2.4, "#e0d6c0");
    c.fillStyle = ev.done ? "#4a3a2a" : "#6a4a2a"; c.fillRect(x - 1, y - 9, 9, 9); c.fillStyle = "#3a2a1a"; c.fillRect(x - 1, y - 9, 9, 2); c.fillRect(x + 6, y - 7, 2, 5);
    if (!ev.done && Math.random() < 0.04) FX.p({ x: x + 3 + (Math.random() - 0.5) * 6, y: y - 10, vx: 0, vy: -12, life: 0.7, size: 1.2, col: "#ffd27a", kind: "spark", add: true });
  }
  /* ======================= BEFREITE KUNDSCHAFTER KÄMPFEN MIT (W13 R15) ======================= */
  /* Der Käfig-Gefangene dankt nicht nur: er zieht seinen Dolch und kämpft eine Weile an Ezekiels Seite (folgt, greift den nächsten
     Gegner an, kann nicht sterben), bis die Zeit um ist oder das Gebiet wechselt. Werte als Vorschlag für Balance in HELFER. */
  const HELFER = { dauer: 35, dmg: t => 7 + 4 * t, takt: 0.8, reichweite: 220, splitter: 25 };
  Z.HELFER = HELFER; Z.helferTest = ev => { helferStart(ev); return helfer; }; Z.helferAktiv = () => !!helfer;
  let helfer = null;
  const HELFERSPRUCH = [["„Ich hab noch eine Rechnung offen. Lass mich mitkommen!“", "\"I've got a score to settle. Let me come along!\""], ["„Zwei Klingen sind besser als eine. Na ja – eine Klinge und ein Dolch.“", "\"Two blades beat one. Well – one blade and a dagger.\""], ["„Ich decke dir den Rücken, Gehörnter.“", "\"I've got your back, horned one.\""]];
  function helferStart(ev) {
    const P = Z.player; if (!P) return;
    helfer = { lv: Z.level, x: ev.x - 6, y: ev.y - 22, w: 12, h: 22, vx: 0, vy: 0, face: 1, t: 0, hit: 0, onGround: false, swing: 0 };
    Z.toast(L(Z.R.pick(HELFERSPRUCH)) + "<small>" + L(["Kämpft " + HELFER.dauer + " s an deiner Seite.", "Fights at your side for " + HELFER.dauer + " s."]) + "</small>", 3200);
  }
  function helferTick(dt) {
    const a = helfer; if (!a) return;
    const P = Z.player;
    if (!P || P.dead || Z.level !== a.lv || (a.t += dt) > HELFER.dauer) {
      if (P && Z.level === a.lv) { FX.burst(a.x + a.w / 2, a.y + a.h / 2, 10, { col: ["#a99a8b"], sp: 50, life: 0.5, size: 3, kind: "smoke" }); FX.text(a.x + a.w / 2, a.y - 8, L(["Viel Glück, Gehörnter!", "Good luck, horned one!"]), "#e8d8b0"); }
      helfer = null; return;
    }
    let tgt = null, bd = HELFER.reichweite;
    for (const e of Z.enemies) { if (e.dead || e.hidden || e.def.boss && !e.nmMini || e.intro > 0) continue; const d = Math.hypot(e.x - a.x, e.y - a.y); if (d < bd && Math.abs(e.y - a.y) < 80) { bd = d; tgt = e; } }
    const tx = tgt ? tgt.x + tgt.w / 2 : P.x + P.w / 2 - P.face * 22, dx = tx - (a.x + a.w / 2);
    a.face = Math.sign(dx) || a.face;
    const sp = tgt ? 170 : Math.abs(dx) > 26 ? 160 : 0;
    a.vx += ((Math.sign(dx) * sp) - a.vx) * Math.min(1, dt * 10);
    a.vy = Math.min(500, a.vy + 1400 * dt);
    if (a.onGround && (a.hitWall || (tgt ? tgt.y + tgt.h < a.y - 10 : P.y + P.h < a.y - 20) && Math.abs(dx) < 70)) a.vy = -380;
    Z.moveBody(a, dt);
    /* weit abgehängt (Leiter, Abgrund): kurzer Rauch, neben Ezekiel wieder da */
    if (Math.hypot(P.x - a.x, P.y - a.y) > 320) { FX.burst(a.x + a.w / 2, a.y + a.h / 2, 6, { col: ["#a99a8b"], sp: 40, life: 0.4, size: 2.5, kind: "smoke" }); a.x = P.x - P.face * 20; a.y = P.y + P.h - a.h; a.vx = a.vy = 0; }
    a.hit -= dt; a.swing = Math.max(0, a.swing - dt * 4);
    if (tgt && a.hit <= 0 && Math.abs(dx) < 22 && Math.abs((tgt.y + tgt.h) - (a.y + a.h)) < 30) {
      a.hit = HELFER.takt; a.swing = 1; Z.hitEnemy(tgt, HELFER.dmg(Z.run ? Z.run.tier : 0), { kb: 60, src: "helfer", dir: a.face });
      A.play("slash", { x: a.x, vol: 0.35, rate: 1.2 });
    }
  }
  function drawHelfer(c, t) {
    const a = helfer; if (!a || Z.level !== a.lv) return;
    if (Z.helferGemalt && Z.helferGemalt(c, a, t, HELFER)) return; /* W11 R37 (Grafik): gemalte Fassung in effekte.js */
    const cx = a.x + a.w / 2, fy = a.y + a.h, left = HELFER.dauer - a.t;
    c.save(); if (left < 4 && Math.floor(t * 8) % 2) c.globalAlpha = 0.55;
    Z.drawNPC(c, "A", cx, fy, t * (Math.abs(a.vx) > 20 ? 3 : 1), a.face);
    /* Dolch */
    c.translate(cx + a.face * 5, fy - 12); c.rotate(a.face * (a.swing > 0 ? 1.2 - a.swing * 2 : 0.5)); c.fillStyle = "#c8c0b0"; c.fillRect(-1, -9, 2, 9); c.fillStyle = "#5a3a22"; c.fillRect(-1.5, 0, 3, 3);
    c.restore();
  }
  /* ======================= HEILQUELLE (W13 R11) ======================= */
  /* Balance meldete: vor Stufe 4 sind die Tränke meist leer. Selten steht an einer Kreuzung des Hauptwegs (Raum mit ≥ 3 Ausgängen,
     auf dem Weg vom Eingang zum Ausgang) eine Quelle – eine Entscheidung „jetzt oder später“: trinken (Leben sofort) ODER eine Flasche
     füllen (+1 Trank, nur wenn eine Flasche leer ist). Einmal je Quelle. Werte als Vorschlag für Balance in QUELLE. */
  /* W13 R18: Quirins „Quellwasser“ (Lager-Zusatz) – Quellen heilen mehr */
  const quelleHeil = () => QUELLE.heal + (Z.lager && Z.lager.level && Z.lager.level("quirin", "quellwasser") >= 1 ? QUELLE.quirin : 0);
  const QUELLE = { heal: 0.4, quirin: 0.2, chance: lv => { const t = Z.run ? Z.run.tier : 0; return t >= 1 && t <= 3 ? 0.35 : 0; } };
  Z.QUELLE = QUELLE;
  function setupQuelle(lv) {
    const W = lv.W, D4 = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
    const cands = Object.keys(lv.cells || {}).map(k => lv.cells[k]).filter(c => c.kind === "path" && Object.keys(D4).filter(s2 => c.need[s2]).length >= 3);
    const startK = lv.startCell ? lv.startCell.x + "," + lv.startCell.y : null;
    for (const c of Z.R.shuffle(cands)) {
      if (c.x + "," + c.y === startK) continue;
      const mx = c.x * Z.CW + Z.CW / 2, my = c.y * Z.CH + Z.CH / 2, sp = [];
      for (let y = c.y * Z.CH + 1; y < c.y * Z.CH + Z.CH - 1; y++) for (let x = c.x * Z.CW + 2; x < c.x * Z.CW + Z.CW - 2; x++)
        if ((!lv.reach || lv.reach[y * W + x]) && Z.standable(lv, x, y, 3) && Z.standable(lv, x - 1, y, 3) && Z.standable(lv, x + 1, y, 3) && !(lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3) && !(lv.morsch || []).some(m => Math.abs(m.y - (y + 1)) <= 1 && x >= m.x0 - 2 && x <= m.x1 + 2) && !(lv.traps || []).some(q => Math.abs(q.x - x) < 3 && Math.abs(q.y - y) < 3)) sp.push([x, y]);
      if (!sp.length) continue;
      sp.sort((a, b) => Math.abs(a[0] - mx) + Math.abs(a[1] - my) - Math.abs(b[0] - mx) - Math.abs(b[1] - my));
      const [x, y] = sp[0];
      return { k: "quelle", x: x * T + 8, y: (y + 1) * T, done: false, t: 0, cell: c.x + "," + c.y };
    }
    return null;
  }
  function quelleInteract(ev) {
    const P = () => Z.player;
    const kannFuellen = () => { const p = P(); return p && !pact("durst") && p.potMax > 0 && p.potions < p.potMax; };
    (Z.interacts = Z.interacts || []).push({ x: ev.x - 9, y: ev.y, r: 16, h: 34, ok: () => !ev.done,
      label: () => L(["Trinken (+", "Drink (+"]) + Math.round(quelleHeil() * 100) + L([" % Leben)", "% health)"]), use: () => quelleNimm(ev, "trinken") });
    (Z.interacts = Z.interacts || []).push({ x: ev.x + 9, y: ev.y, r: 16, h: 34, ok: () => !ev.done,
      label: () => kannFuellen() ? L(["Flasche füllen (+1 Trank)", "Fill a flask (+1 potion)"]) : L(["Flasche füllen (alle voll)", "Fill a flask (all full)"]), use: () => { if (kannFuellen()) quelleNimm(ev, "fuellen"); else Z.toast(pact("durst") ? L(["Der Pakt lässt keine Flasche zu.", "The pact allows no flask."]) : L(["Deine Flaschen sind voll – trink lieber, oder komm später wieder.", "Your flasks are full – drink instead, or come back later."]), 2400); } });
  }
  function quelleNimm(ev, art) {
    const P = Z.player; if (ev.done || !P) return; ev.done = true; finish(ev);
    A.play("splash", { vol: 0.7, x: ev.x }); FX.burst(ev.x, ev.y - 10, 16, { col: ["#9ac0a0", "#e8f0d8", "#ffd27a"], sp: 70, up: 50, life: 0.8, size: 2, kind: "glow", add: true });
    if (art === "trinken") { Z.healPlayer(P.hpMax * quelleHeil()); FX.text(P.x + P.w / 2, P.y - 14, L(["Erfrischt", "Refreshed"]), "#c8e0a8", true); }
    else { P.potions = Math.min(P.potMax, P.potions + 1); FX.text(P.x + P.w / 2, P.y - 14, L(["+1 Trank", "+1 potion"]), "#ffd27a", true); }
    Z.toast(L(["Die Quelle versiegt.", "The spring runs dry."]), 1800);
  }
  function drawQuelle(c, ev, t) {
    if (Z.quelleGemalt && Z.quelleGemalt(c, ev, t)) return;
    const x = ev.x, y = ev.y;
    c.fillStyle = "#4a4448"; c.fillRect(x - 16, y - 8, 32, 8); c.fillStyle = "#5a5458"; c.fillRect(x - 18, y - 10, 36, 3);
    c.fillStyle = "#3a3438"; c.fillRect(x - 3, y - 26, 6, 16); c.fillStyle = "#5a5458"; c.fillRect(x - 6, y - 28, 12, 3);
    if (!ev.done) {
      ell(c, x, y - 8, 14, 2.6, "#5a8a6a");
      c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 14, 26 + Math.sin(t * 2) * 3, "rgba(170,220,150,.28)"); c.restore();
      c.fillStyle = "rgba(200,235,190,.8)"; const k = (t * 30) % 10; c.fillRect(x - 0.8, y - 25 + k, 1.6, 3);
      if (Math.random() < 0.08) FX.p({ x: x + (Math.random() - 0.5) * 20, y: y - 9, vx: 0, vy: -14, life: 0.9, size: 1.4, col: "#d8f0c8", kind: "glow", add: true });
    } else ell(c, x, y - 8, 14, 2.6, "#2a2a26");
  }
  /* ======================= HEBELRÄTSEL (W13 R9) ======================= */
  /* In einem Geheimraum: eine Steintafel zeigt 3 (ab Stufe 4: 4) Zeichen in Reihenfolge, daneben gleich viele Hebel mit je einem Zeichen.
     Richtige Reihenfolge ziehen → Truhe + Gold. Falscher Hebel → alle springen zurück (kein Schaden, beliebig oft).
     Erreichbarkeit: Prüferkanten mit zerschlagenen Rissen (Kachel 7 offen) ab dem Gebietsstart. Geheimräume liegen nie auf dem Hauptweg. */
  const RZ = [{ id: "raute", g: "◆", col: "#e5b454" }, { id: "dreieck", g: "▲", col: "#d0503a" }, { id: "kreis", g: "●", col: "#efe6d0" }, { id: "kreuz", g: "✚", col: "#6aa04a" }];
  function setupRaetsel(lv) {
    const secrets = Object.keys(lv.cells || {}).filter(k => lv.cells[k].kind === "secret"); if (!secrets.length) return null;
    const f = { W: lv.W, H: lv.H, get: (x, y) => { const v = lv.get(x, y); return v === 7 ? 0 : v; }, start: lv.start, doors: [], cells: lv.cells };
    Z.validateLevel(f, null, true); const reach = f.reach, W = lv.W; /* bequeme Reichweite (4 hoch / 5 weit) */
    const n = (Z.run && Z.run.tier >= 4) ? 4 : 3;
    for (const key of Z.R.shuffle(secrets.slice())) {
      const c = lv.cells[key], sp = [];
      /* nicht auf Truhen, Schlüsseln, Schreinen o. Ä. (sonst greift Benutzen das falsche Ding) */
      const busy = [].concat((lv.rewards || []).map(r => [r.x, r.y]), (lv.feats || []).map(q => [q.x, q.y != null ? q.y : q.y0]), (lv.loot || []).map(q => [q.x, q.y]));
      for (let y = c.y * Z.CH + 1; y < c.y * Z.CH + Z.CH - 1; y++) for (let x = c.x * Z.CW + 1; x < c.x * Z.CW + Z.CW - 1; x++)
        if (reach[y * W + x] && Z.standable(lv, x, y, 2) && !busy.some(([bx, by]) => Math.abs(bx - x) <= 2 && Math.abs(by - y) <= 2)) sp.push({ x, y });
      if (sp.length < n + 1) continue;
      /* Tafel zuerst; Hebel nur, was von der Tafel aus OHNE weitere Risse erreichbar ist (alles in einem Zug lösbar) */
      let tab = null, levers = null;
      for (const t0 of Z.R.shuffle(sp.slice()).slice(0, 4)) {
        const g2 = { W: lv.W, H: lv.H, get: lv.get, start: t0, doors: [], cells: lv.cells }; Z.validateLevel(g2, null, true);
        const pick = [];
        for (const q of Z.R.shuffle(sp.filter(q => q !== t0 && g2.reach[q.y * W + q.x]))) { if (pick.length >= n) break; if ([t0].concat(pick).every(r => Math.abs(r.x - q.x) >= 3 || Math.abs(r.y - q.y) >= 3)) { const g3 = { W: lv.W, H: lv.H, get: lv.get, start: q, doors: [], cells: lv.cells }; Z.validateLevel(g3, null, true); if (g3.reach[t0.y * W + t0.x]) pick.push(q); /* auch zurück zur Tafel – keine Einbahn-Falle */ } }
        if (pick.length >= n) { tab = t0; levers = pick.sort((a, b) => a.x - b.x || a.y - b.y); break; }
      }
      if (!tab) continue;
      const sym = Z.R.shuffle(RZ.slice(0, n).map((_, i) => i)); /* Zeichen je Hebel */
      const seq = Z.R.shuffle(levers.map((_, i) => i)); /* richtige Reihenfolge der Hebel */
      return { k: "raetsel", cell: key, x: tab.x * T + 8, y: (tab.y + 1) * T, done: false, t: 0, prog: 0, resetT: 0, fails: 0, seq,
        levers: levers.map((q, i) => ({ x: q.x * T + 8, y: (q.y + 1) * T, sym: sym[i], down: false, a: 0 })) };
    }
    return null;
  }
  function raetselInteract(ev) {
    ev.levers.forEach((lvr, i) => (Z.interacts = Z.interacts || []).push({ x: lvr.x, y: lvr.y, r: 22, h: 34, ok: () => !ev.done && !lvr.down && ev.resetT <= 0,
      label: () => L(["Hebel ", "Lever "]) + RZ[lvr.sym].g + L([" ziehen", ""]), use: () => raetselPull(ev, i) }));
  }
  function raetselPull(ev, i) {
    const lvr = ev.levers[i]; if (ev.done || lvr.down || ev.resetT > 0) return;
    lvr.down = true; A.play("chain", { vol: 0.5, rate: 1.3, x: lvr.x });
    if (ev.seq[ev.prog] === i) {
      ev.prog++; FX.text(lvr.x, lvr.y - 22, RZ[lvr.sym].g, RZ[lvr.sym].col, true);
      if (ev.prog >= ev.levers.length) {
        ev.done = true; finish(ev); A.play("holy", { vol: 0.6 }); FX.flashScreen("#ffd27a", 0.2);
        Z.dropItem(ev.x, ev.y - 6, { chest: true }); const P = Z.player, g = 50 + 15 * (Z.run ? Z.run.tier : 0); P.gold += g;
        Z.toast("✦ <b>" + L(["Rätsel gelöst", "Puzzle solved"]) + "</b><small>" + L(["Hinter der Tafel klickt ein Riegel – eine Truhe und " + g + " Gold.", "A latch clicks behind the tablet – a chest and " + g + " gold."]) + "</small>", 3200);
        X().raetsel = (X().raetsel || 0) + 1; give("e_raetsel"); Z.saveMeta();
        if (joriFunken(true)) Z.spawnReward && Z.spawnReward("glut", ev.x, ev.y - 10, { n: 1 });
      }
    } else {
      ev.fails++; ev.resetT = 0.7; A.play("rock", { vol: 0.4, rate: 0.7, x: lvr.x });
      FX.text(lvr.x, lvr.y - 22, L(["Falsch – die Hebel springen zurück", "Wrong – the levers snap back"]), "#d0503a");
    }
  }
  function raetselTick(ev, dt) {
    for (const lvr of ev.levers) lvr.a += ((lvr.down ? 1 : 0) - lvr.a) * Math.min(1, dt * 12);
    if (ev.resetT > 0) { ev.resetT -= dt; if (ev.resetT <= 0) { ev.prog = 0; for (const lvr of ev.levers) lvr.down = false; A.play("chain", { vol: 0.35, rate: 0.8 }); } }
  }
  /* Zeichen als Formen (lesbar ohne Schrift; Grafik-Agent kann übermalen: Z.raetselGemalt) */
  function rzShape(c, k, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    if (k === 0) { c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.8, y); }
    else if (k === 1) { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); }
    else if (k === 2) { c.arc(x, y, r * 0.85, 0, 6.283); }
    else { c.rect(x - r * 0.3, y - r, r * 0.6, r * 2); c.rect(x - r, y - r * 0.3, r * 2, r * 0.6); }
    c.fill();
  }
  function drawRaetsel(c, ev, t) {
    if (Z.raetselGemalt && Z.raetselGemalt(c, ev, t, RZ)) return;
    const cam = Z.cam, vis = (x, y) => !(x < cam.x - 60 || x > cam.x + cam.w + 60 || y < cam.y - 60 || y > cam.y + cam.h + 60);
    const n = ev.levers.length;
    if (vis(ev.x, ev.y)) {
      /* Steintafel: Zeichen in Reihenfolge, darunter Punkte für den Fortschritt */
      const w = 10 + n * 14, x0 = ev.x - w / 2, y0 = ev.y - 40;
      c.fillStyle = "#3a3236"; c.fillRect(ev.x - 3, ev.y - 12, 6, 12); c.fillStyle = "#5a5056"; c.fillRect(x0, y0, w, 28); c.fillStyle = "#463e44"; c.fillRect(x0 + 2, y0 + 2, w - 4, 24);
      ev.seq.forEach((li, k) => { const sk = ev.levers[li].sym, cx = x0 + 12 + k * 14; rzShape(c, sk, cx, y0 + 11, 4.5, ev.done || k < ev.prog ? RZ[sk].col : "#c8b8a0"); c.fillStyle = k < ev.prog || ev.done ? "#ffd27a" : "#2a2226"; c.fillRect(cx - 1.5, y0 + 20, 3, 3); });
      if (!ev.done) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, ev.x, y0 + 12, 22 + Math.sin(t * 2) * 2, "rgba(255,200,120,.18)"); c.restore(); }
      const P = Z.player;
      const nah = (x, y, dx, dy) => P && Math.abs(P.x + P.w / 2 - x) < dx && Math.abs(P.y + P.h - y) < dy;
      if (P && !ev.done && (nah(ev.x, ev.y, 70, 50) || ev.levers.some(l => nah(l.x, l.y, 90, 60))) && Z.ui && Z.ui.worldLabel)
        Z.ui.worldLabel("raetsel" + Math.round(ev.x), { x: ev.x, y: y0 - 10, html: esc(L(["Reihenfolge: ", "Order: "])) + ev.seq.map(li => '<b style="color:' + RZ[ev.levers[li].sym].col + '">' + RZ[ev.levers[li].sym].g + "</b>").join(" → "), jetzt: true });
    }
    for (const lvr of ev.levers) {
      if (!vis(lvr.x, lvr.y)) continue;
      const x = lvr.x, y = lvr.y;
      c.fillStyle = "#3a3030"; c.fillRect(x - 6, y - 4, 12, 4);
      c.save(); c.translate(x, y - 3); c.rotate(-0.7 + lvr.a * 1.4); c.fillStyle = "#6a4a30"; c.fillRect(-1, -13, 2.4, 13); c.restore();
      rzShape(c, lvr.sym, x, y - 22, 4, ev.done ? "#ffd27a" : RZ[lvr.sym].col);
    }
  }
  /* Sockel über das gemeinsame Benutzen-System (Z.interacts): Vorrang/Beschriftung wie Hebel, kein Konflikt mit Schildern & Co. */
  function rennenInteract(ev) {
    (Z.interacts = Z.interacts || []).push({ x: ev.x, y: ev.y, r: 26, h: 34, ok: () => !ev.done && !ev.on, label: () => L(["Zeitrennen starten", "Start time trial"]) + " (" + ev.limit + " s)", use: () => rennenStart(ev) });
  }
  function rennenStart(ev) {
    if (ev.done || ev.on) return; ev._start = true;
  }
  function rennenTick(ev, dt, use) {
    const P = Z.player;
    if (!ev.on) {
      if (ev._start) {
        ev._start = false; ev.on = true; ev.left = ev.limit; ev.tries++; for (const r of ev.rings) r.got = false;
        A.play("gong", { vol: 0.5, rate: 1.4 }); FX.ring(ev.x, ev.y - 14, 40, "#ffd27a", 0.5, 2);
        Z.toast("⏳ <b>" + L(["Zeitrennen", "Time trial"]) + "</b><small>" + L(["Sammle alle " + ev.rings.length + " Ringe in " + ev.limit + " Sekunden.", "Collect all " + ev.rings.length + " rings in " + ev.limit + " seconds."]) + "</small>", 3000);
      }
      return;
    }
    const sec = Math.ceil(ev.left); ev.left -= dt;
    if (Math.ceil(ev.left) !== sec && sec <= 6 && sec > 1) { FX.text(P.x + P.w / 2, P.y - 18, sec - 1 + " s", "#ffc24a"); A.play("ui", { vol: 0.3, rate: 1.6 }); }
    for (const r of ev.rings) if (!r.got && Math.abs(P.x + P.w / 2 - r.x) < 15 && Math.abs(P.y + P.h / 2 - r.y) < 20) {
      r.got = true; A.play("coin", { vol: 0.55, rate: 1 + 0.08 * ev.rings.filter(q => q.got).length }); FX.burst(r.x, r.y, 12, { col: ["#ffd27a", "#fff2c0"], sp: 90, life: 0.5, size: 2, kind: "glow", add: true });
    }
    const got = ev.rings.filter(r => r.got).length;
    if (got >= ev.rings.length) {
      ev.on = false; finish(ev); A.play("holy", { vol: 0.6 }); FX.flashScreen("#ffd27a", 0.25);
      Z.dropItem(P.x + P.w / 2, P.y, { chest: true }); P.gold += 40 + 20 * ev.rings.length; FX.text(P.x + P.w / 2, P.y - 22, L(["Geschafft! ", "Done! "]) + Math.max(0, ev.left).toFixed(1) + " s", "#ffd27a", true);
      X().rennen = (X().rennen || 0) + 1; give("f_rennen"); return;
    }
    if (ev.left <= 0 || P.dead) {
      ev.on = false; for (const r of ev.rings) r.got = false;
      if (ev.tries >= 3) { finish(ev); Z.toast(L(["Die Sanduhr zerspringt. Keine weiteren Versuche.", "The hourglass shatters. No more tries."]), 2600); A.play("break", { vol: 0.5 }); }
      else Z.toast(L(["Zu langsam (" + got + "/" + ev.rings.length + "). Noch " + (3 - ev.tries) + " Versuch(e) am Sockel.", "Too slow (" + got + "/" + ev.rings.length + "). " + (3 - ev.tries) + " more tr" + (3 - ev.tries === 1 ? "y" : "ies") + " at the pedestal."]), 2800);
    }
  }
  function evTick(dt) {
    const P = Z.player; if (!P || !Z.level) return;
    const use = inp.pressed.use && !Z.interactTarget && !(Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive));
    for (const ev of evs) {
      if (ev.done) continue; ev.t = (ev.t || 0) + dt;
      switch (ev.k) {
        case "dieb": {
          const e = ev.e; if (!e) break;
          if (e.dead) { finish(ev); for (let i = 0; i < 12; i++) Z.spawnPickup("gold", e.x + e.w / 2, e.y + e.h / 2, { n: 8 + ((Math.random() * 10) | 0), vx: (Math.random() - 0.5) * 220, vy: -200 - Math.random() * 160 }); Z.dropItem(e.x + e.w / 2, e.y, { elite: true }); FX.text(e.x + e.w / 2, e.y - 10, L(["Mein Gold!", "My gold!"]), "#ffd27a", true); break; }
          e.aware = true; e.st.fear = 1; e.cd = 9;
          ev.t0 += dt; if (Math.random() < dt * 6) FX.p({ x: e.x + e.w / 2, y: e.y + 4, vx: (Math.random() - 0.5) * 30, vy: -40, g: 300, life: 0.5, size: 1.6, col: "#ffd27a", kind: "spark", add: true });
          if (ev.t0 > 24) { FX.burst(e.x + e.w / 2, e.y + e.h / 2, 16, { col: ["#a99a8b", "#ffd27a"], sp: 80, life: 0.5, size: 3, kind: "smoke" }); e.dead = true; e.deadT = 9; ev.done = true; FX.text(e.x + e.w / 2, e.y - 10, L(["Hihihi!", "Teehee!"]), "#ffd27a"); }
          break;
        }
        /* Schrein und Händlerin: keine Fenster – beim Näherkommen liegen die Wahlen in der Welt */
        case "schrein": if (!ev.welt && near(ev, 110)) shrineChoice(ev); else if (!ev.welt && near(ev) && use) { inp.consume("use"); shrineChoice(ev); } break;
        case "haendler": if (!ev.welt && near(ev, 120)) traderEvent(ev); else if (!ev.welt && near(ev, 26) && use) { inp.consume("use"); traderEvent(ev); } break;
        case "brunnen": if (near(ev) && use) { inp.consume("use"); if (P.gold >= 60) { P.gold -= 60; const r = Math.random(); A.play("splash", { vol: 0.6 }); FX.burst(ev.x, ev.y - 10, 16, { col: ["#ffd27a", "#c0e0d0"], sp: 80, up: 60, life: 0.7, size: 2, kind: "glow", add: true }); if (r < 0.35) { Z.healPlayer(P.hpMax); Z.toast(L(["Das Wasser heilt dich vollständig.", "The water heals you completely."]), 2600); } else if (r < 0.7) { Z.dropItem(ev.x, ev.y - 10, { chest: true }); Z.toast(L(["Etwas glänzt im Wasser …", "Something glitters in the water…"]), 2600); } else if (r < 0.9) { P.potions = Math.min(P.potMax + 1, P.potions + 1); P.potMax = Math.max(P.potMax, P.potions); Z.toast(L(["Ein voller Trank treibt nach oben.", "A full potion floats up."]), 2600); } else { Z.toast(L(["Nichts. Echo kichert irgendwo.", "Nothing. Somewhere, Echo giggles."]), 2600); } finish(ev); } else { Z.toast(L(["Der Brunnen will 60 Gold.", "The well wants 60 gold."]), 2000); } } break;
        case "kaefig": if (near(ev, 26) && use) { inp.consume("use"); finish(ev); A.play("chain", { vol: 0.8 }); FX.burst(ev.x, ev.y - 10, 18, { col: ["#9a8a7a", "#5a4a40"], sp: 120, life: 0.5, size: 2.4, kind: "shard", g: 500 }); Z.dropShards(ev.x, ev.y - 8, HELFER.splitter); helferStart(ev); } break;
        case "wette":
          if (!ev.on && near(ev, 26) && use) { inp.consume("use"); ev.on = true; ev.left = 30; ev.hp0 = P.dmgTaken; ev.k0 = Z.stats.kills || 0; Z.toast(L(["Barradin: „30 Sekunden, drei Kills, kein Kratzer. Ich wette meine Laute dagegen.“", "Barradin: \"30 seconds, three kills, not a scratch. I bet my lute you can't.\""]), 3600); }
          else if (ev.on) {
            const sec = Math.ceil(ev.left); ev.left -= dt; if (Math.ceil(ev.left) !== sec) FX.text(P.x + P.w / 2, P.y - 18, sec - 1 + " s · " + Math.max(0, 3 - ((Z.stats.kills || 0) - ev.k0)) + L([" Kills", " kills"]), "#ffc24a");
            if (P.dmgTaken > ev.hp0) { ev.on = false; finish(ev); Z.toast(L(["Barradin: „Ha! Ein Kratzer! Die Laute bleibt bei mir.“", "Barradin: \"Ha! A scratch! The lute stays with me.\""]), 3000); A.play("laugh", { vol: 0.5 }); }
            else if ((Z.stats.kills || 0) - ev.k0 >= 3 && ev.left <= 0 || ((Z.stats.kills || 0) - ev.k0 >= 3 && ev.left < 25)) { ev.on = false; finish(ev); M().betWon = 1; Z.dropItem(P.x + P.w / 2, P.y, { boss: true }); P.gold += 150; Z.toast(L(["Barradin: „… gut. GUT. Nimm. Und erzähl es niemandem.“", "Barradin: \"…fine. FINE. Take it. And tell no one.\""]), 3200); A.play("holy", { vol: 0.5 }); }
            else if (ev.left <= 0) { ev.on = false; finish(ev); Z.toast(L(["Barradin: „Zu langsam. Die Ballade wird kürzer.“", "Barradin: \"Too slow. The ballad gets shorter.\""]), 3000); }
          }
          break;
        case "rennen": rennenTick(ev, dt, use); break;
        case "raetsel": raetselTick(ev, dt); break;
        case "rune": if (near(ev, 18)) { ev.done = true; M().runes[ev.rk] = 1; Z.saveMeta(); FX.flashScreen("#d8d0e8", 0.5); A.play("holy", { vol: 0.8 }); FX.burst(ev.x, ev.y - 10, 30, { col: ["#d8d0e8", "#c03a5a", "#fff"], sp: 120, up: 40, life: 1, size: 2.4, kind: "glow", add: true }); const n = Object.keys(M().runes).length; Z.toast("◆ <b>" + L(["Runen-Fragment gefunden", "Rune fragment found"]) + " (" + n + "/3)</b><br><small>" + L(n >= 3 ? ["Alle drei! Nach dem nächsten Endboss öffnet sich ein Riss im Netz …", "All three! After the next final boss, a rift in the web will open…"] : ["Irgendwo im Netz zuckt etwas.", "Somewhere in the web, something twitches."]) + "</small>", 4600); } break;
      }
    }
  }
  /* Verfluchter Schrein: Wahl zwischen zwei Segen (oder keinem). Preis: ein Fünftel des Lebens. */
  function shrineChoice(ev) {
    const P = Z.player; const ids = Z.R.shuffle(Object.keys(Z.BLESS).filter(b => !P.bless.includes(b))).slice(0, 2);
    if (!ids.length) { finish(ev); return; }
    if (ui().auslage && ui().segenKugel) {
      /* zwei Kugeln über dem Schrein: hingehen zeigt den Segen, Benutzen nimmt ihn (Preis: ein Fünftel des Lebens) */
      ev.welt = true;
      ui().auslage({ key: "schrein" + Math.round(ev.x), x: ev.x, y: ev.y, abstand: 30, hoch: 42, einmal: true, aktiv: () => !ev.done,
        items: ids.map(b => ui().segenKugel(b, () => { shrineEv = ev; shrineTake(b); }, { unter: L(["kostet ⅕ Leben", "costs ⅕ health"]), artL: "gefahr", verb: L(["opfern & nehmen", "sacrifice & take"]) })) });
      return;
    }
    const kb = i => (inp.device === "keys" && !ui().touchOn ? "<kbd>" + (i + 1) + "</kbd> " : "");
    ui().open("<h2>" + L(["Verfluchter Schrein", "Cursed Shrine"]) + '</h2><p class="hinweis">' + L(["Zwei Segen flackern im violetten Licht. Der Schrein nimmt ein Fünftel deines Lebens – für einen davon.", "Two blessings flicker in the violet light. The shrine takes a fifth of your life – for one of them."]) + '</p><div class="rollen">' +
      ids.map((b, i) => { const d = Z.BLESS[b]; return '<button data-act="abShrine" data-arg="' + b + '" data-key="' + (i + 1) + '" class="k-' + d.k + '"' + (i === 0 ? " autofocus" : "") + "><b>" + kb(i) + esc(L(d.n)) + '</b><small class="art">' + esc(L(Z.BLESS_KIND[d.k])) + "</small><small>" + esc(L(d.d)) + "</small></button>"; }).join("") +
      '</div><div class="knoepfe"><button data-act="close">' + L(["Nichts opfern", "Sacrifice nothing"]) + "</button></div>", { cls: "schmal" });
    shrineEv = ev;
  }
  let shrineEv = null;
  function shrineTake(b) {
    const P = Z.player, ev = shrineEv; shrineEv = null; ui().close(); if (!ev || ev.done || !Z.BLESS[b]) return;
    P.bless.push(b); P.hpMax = Math.max(20, Math.round(P.hpMax * 0.8)); P.hp = Math.min(P.hp, P.hpMax);
    FX.flashScreen("#a040ff", 0.4); A.play("magic", { vol: 0.7, rate: 0.6 }); FX.text(P.x + P.w / 2, P.y - 14, L(Z.BLESS[b].n), "#c890ff", true);
    Z.toast(L(["Der Schrein nimmt ein Fünftel deines Lebens und schenkt: ", "The shrine takes a fifth of your life and grants: "]) + "<b>" + esc(L(Z.BLESS[b].n)) + "</b><br><small>" + esc(L(Z.BLESS[b].d)) + "</small>", 4200);
    finish(ev);
  }
  /* Fahrende Händlerin (Echo verkleidet?): eine Waffe mit Rabatt – oder ein Glücksbeutel mit Risiko */
  let tradeEv = null;
  function traderEvent(ev) {
    const P = Z.player; tradeEv = ev;
    if (!ev.it) ev.it = Z.rollItem({ kind: "weapon", rar: [20, 50, 25, 5] });
    const tier = Z.run ? Z.run.tier : 0, price = ev.it ? Math.round(Z.itemPrice(ev.it) * 0.6) : 0, bag = Math.round(90 * (1 + 0.5 * tier));
    ev.price = price; ev.bag = bag;
    if (ui().auslage) {
      /* Waren liegen auf ihrem Karren: Preis schwebt darüber, Benutzen kauft */
      ev.welt = true;
      const items = [];
      if (ev.it && !ev.sold) items.push({ art: "ware", it: ev.it, preis: price, verb: L(["kaufen & anlegen (−40 %)", "buy & equip (−40%)"]),
        kannt: () => Z.player.gold >= price || (ui().notify(L(["Zu wenig Gold.", "Not enough gold."]), { prio: 3 }), false),
        nimm: (d, g, e) => { const P2 = Z.player; P2.gold -= price; ev.sold = true; A.play("coin", { vol: 0.6 }); const p = Z.spawnPickup("item", e.x, e.y, { it: ev.it, vx: 0, vy: 0, float: true }); ui().offerItem(p); ui().say(ev.x + 18, ev.y - 26, L(["Händlerin", "Trader"]), L(["„Gern geschehen. Ich war nie hier.“", "\"My pleasure. I was never here.\""]), 2600); if (ev.bagUsed) finish(ev); } });
      items.push({ art: "ware", icon: "beutel", col: "#9a6a3e", name: L(["Glücksbeutel", "Lucky bag"]), preis: bag, verb: L(["hineingreifen", "reach in"]),
        cardHTML: '<div class="ic-kopf" style="--rar:#e5b454"><b>' + L(["Glücksbeutel", "Lucky bag"]) + "</b><small>" + L(["Ein Griff pro Begegnung. Kein Umtausch.", "One grab per encounter. No refunds."]) + "</small></div><p>" + L(["40 %: 2 Schmiedeglut · 25 %: seltene Waffe · 15 %: Schriftrolle · 20 %: ein Stein.", "40%: 2 forge embers · 25%: rare weapon · 15%: scroll · 20%: a rock."]) + "</p>",
        kannt: () => Z.player.gold >= bag || (ui().notify(L(["Zu wenig Gold.", "Not enough gold."]), { prio: 3 }), false),
        nimm: () => { tradeEv = ev; trade("bag"); } });
      ui().auslage({ key: "haendlerin" + Math.round(ev.x), x: ev.x - 3, y: ev.y, abstand: 22, hoch: 30, items, aktiv: () => !ev.done });
      return;
    }
    const k = (n) => (inp.device === "keys" && !ui().touchOn ? "<kbd>" + n + "</kbd> " : "");
    ui().open("<h2>" + L(["Fahrende Händlerin", "Wandering Trader"]) + ' <span class="bank">' + U.fmt(P.gold) + " ● " + L(["Gold", "Gold"]) + '</span></h2><p class="hinweis">„' + L(["Psst. Ein Stück, frisch aus einer Truhe, die niemandem gehört hat. Oder du greifst in den Beutel. Kein Umtausch.", "Psst. A piece fresh from a chest that belonged to no one. Or you reach into the bag. No refunds."]) + '“</p><div class="liste">' +
      (ev.it && !ev.sold ? '<div class="zeile ware"><div class="ic">' + ui().itemCardHTML(ev.it, true) + '</div><div class="kauf"><button data-act="abTrade" data-arg="buy" data-key="1" autofocus' + (P.gold < price ? " disabled" : "") + ">" + k(1) + U.fmt(price) + " ● <small>(−40 %)</small></button></div></div>" : "") +
      '<div class="zeile"><div><b>' + L(["Glücksbeutel", "Lucky bag"]) + "</b><small>" + L(["40 %: 2 Schmiedeglut · 25 %: seltene Waffe · 15 %: Schriftrolle · 20 %: ein Stein. Ein Griff pro Begegnung.", "40%: 2 forge embers · 25%: rare weapon · 15%: scroll · 20%: a rock. One grab per encounter."]) + '</small></div><div class="kauf"><button data-act="abTrade" data-arg="bag" data-key="2"' + (P.gold < bag || ev.bagUsed ? " disabled" : "") + ">" + k(2) + (ev.bagUsed ? L(["leer", "empty"]) : U.fmt(bag) + " ●") + "</button></div></div>" +
      '</div><div class="knoepfe"><button data-act="close">' + L(["Weitergehen", "Move on"]) + "</button></div>", { cls: "breit" });
  }
  function trade(arg) {
    const P = Z.player, ev = tradeEv; if (!ev) return;
    if (arg === "buy" && ev.it && !ev.sold && P.gold >= ev.price) {
      P.gold -= ev.price; ev.sold = true; A.play("coin", { vol: 0.6 }); ui().close();
      Z.spawnPickup("item", ev.x + 14, ev.y - 4, { it: ev.it, vx: 0, vy: -120 }); Z.toast(L(["„Gern geschehen. Ich war nie hier.“", "\"My pleasure. I was never here.\""]), 2600);
    } else if (arg === "bag" && !ev.bagUsed && P.gold >= ev.bag) {
      P.gold -= ev.bag; ev.bagUsed = true; ui().close(); A.play("coin", { vol: 0.5 });
      const r = Math.random(), x = ev.x + 10, y = ev.y - 8;
      if (r < 0.4) { Z.spawnReward ? Z.spawnReward("glut", x, y, { n: 2 }) : null; Z.toast(L(["Zwei glühende Splitter. Die Händlerin pustet sich die Finger.", "Two glowing shards. The trader blows on her fingers."]), 2600); }
      else if (r < 0.65) { Z.dropItem(x, y, { elite: true, kind: "weapon" }); Z.toast(L(["„Oh. Das war eigentlich meins.“", "\"Oh. That was actually mine.\""]), 2600); }
      else if (r < 0.8) { Z.spawnPickup("scroll", x, y, { vx: 0, vy: -150, stat: Z.R.pick(["brut", "takt", "ueber"]) }); Z.toast(L(["Eine Schriftrolle der Macht!", "A scroll of power!"]), 2400); }
      else { Z.toast(L(["Ein Stein. Ein sehr schöner Stein. Echo hätte gelacht.", "A rock. A very nice rock. Echo would have laughed."]), 2600); A.play("rock", { vol: 0.4 }); }
    }
    if (ev.sold && ev.bagUsed) finish(ev);
  }

  /* Zeichnen der Ereignisse */
  function drawEvents(c, t) {
    const lab = inp.device === "touch" ? "✋" : inp.label("use");
    /* Benutzen-Hinweis im gemeinsamen Stil (Eisenplakette + Tastenkappe) */
    const tag = (ev, txt) => { if (!near(ev, 30) || ev.done || ev.welt || (Z.ui && Z.ui.choiceActive)) return; if (Z.ui && Z.ui.worldLabel) Z.ui.worldLabel("ev" + Math.round(ev.x) + "_" + Math.round(ev.y), { x: ev.x, y: ev.y - 36, html: (Z.ui.key("use") || "✋") + " " + esc(txt), jetzt: true }); };
    const cam = Z.cam;
    for (const ev of evs) {
      if (ev.k === "dieb") continue;
      if (ev.k === "raetsel") { drawRaetsel(c, ev, t); continue; }
      if (ev.k === "fund") { const cam = Z.cam; if (!(ev.x < cam.x - 60 || ev.x > cam.x + cam.w + 60 || ev.y < cam.y - 10 || ev.y > cam.y + cam.h + 60)) drawFund(c, ev, t); continue; }
      if (ev.k === "quelle") { const cam = Z.cam; if (!(ev.x < cam.x - 60 || ev.x > cam.x + cam.w + 60 || ev.y < cam.y - 10 || ev.y > cam.y + cam.h + 60)) drawQuelle(c, ev, t); continue; }
      const x = ev.x, y = ev.y;
      if (x < cam.x - 60 || x > cam.x + cam.w + 60 || y < cam.y - 10 || y > cam.y + cam.h + 60) continue; /* nur im Bild */
      if (ev.k === "schrein") { c.fillStyle = "#2a2030"; c.fillRect(x - 7, y - 22, 14, 22); poly(c, [x - 9, y - 22, x + 9, y - 22, x, y - 30], "#3a2a44"); if (!ev.done) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 14, 18 + Math.sin(t * 3) * 3, "rgba(170,80,255,.5)"); c.restore(); circ(c, x, y - 14, 2.4, "#d0a0ff"); } tag(ev, L(["Opfern", "Sacrifice"])); }
      if (ev.k === "brunnen") { ell(c, x, y - 4, 14, 5, "#4a4448"); ell(c, x, y - 5, 11, 3.4, ev.done ? "#2a3a36" : "#4a7a6a"); c.fillStyle = "#3a3438"; c.fillRect(x - 13, y - 22, 2, 18); c.fillRect(x + 11, y - 22, 2, 18); c.fillRect(x - 13, y - 24, 26, 3); if (!ev.done && Math.random() < 0.05) FX.p({ x: x + (Math.random() - 0.5) * 16, y: y - 6, vx: 0, vy: -10, life: 0.8, size: 1.4, col: "#ffd27a", kind: "glow", add: true }); tag(ev, L(["60 Gold opfern", "Offer 60 gold"])); }
      if (ev.k === "kaefig") { if (!ev.done) { Z.drawNPC(c, "A", x, y, t, 1); c.strokeStyle = "#5a5056"; c.lineWidth = 1.2; for (let i = -10; i <= 10; i += 4) { c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i, y - 26); c.stroke(); } c.fillStyle = "#4a4046"; c.fillRect(x - 12, y - 28, 24, 3); c.fillRect(x - 12, y - 2, 24, 2); tag(ev, L(["Befreien", "Free"])); } }
      if (ev.k === "wette") { if (!ev.done || ev.on) { Z.drawNPC(c, "B", x, y, t, Z.player && Z.player.x > x ? 1 : -1); if (!ev.on) tag(ev, L(["Wette annehmen", "Take the bet"])); } }
      if (ev.k === "haendler" && !ev.done) {
        /* kleiner Karren mit Plane, Laterne und der Händlerin */
        c.fillStyle = "#4a3020"; c.fillRect(x - 16, y - 10, 26, 8); c.fillStyle = "#2a1a10"; Z.draw.circ(c, x - 11, y - 2, 3, "#2a1a10"); Z.draw.circ(c, x + 5, y - 2, 3, "#2a1a10");
        c.fillStyle = "#7a2a3a"; c.beginPath(); c.moveTo(x - 17, y - 10); c.quadraticCurveTo(x - 3, y - 24, x + 11, y - 10); c.fill();
        c.save(); c.globalCompositeOperation = "lighter"; glow(c, x + 12, y - 18, 10 + Math.sin(t * 4) * 1.5, "rgba(255,190,90,.5)"); c.restore(); circ(c, x + 12, y - 18, 1.6, "#ffd27a");
        Z.drawNPC(c, "E", x + 18, y, t, Z.player && Z.player.x > x ? 1 : -1);
        tag(ev, L(["Handeln", "Trade"]));
      }
      if (ev.k === "rennen" && Z.rennenGemalt && !(Z.gfx && Z.gfx.off && Z.gfx.off.rennen)) { /* W11 R29/R30: gemalte Fassung in effekte.js; Beschriftung kommt aus Z.interacts */ }
      else if (ev.k === "rennen") {
        c.fillStyle = "#3a3236"; c.fillRect(x - 8, y - 12, 16, 12); c.fillStyle = "#4a4046"; c.fillRect(x - 10, y - 14, 20, 3);
        if (!ev.done) {
          const sy = y - 30; c.fillStyle = "#8a6a3a"; c.fillRect(x - 7, sy - 1, 14, 2); c.fillRect(x - 7, sy + 15, 14, 2);
          poly(c, [x - 5, sy + 1, x + 5, sy + 1, x + 0.8, sy + 8, x + 5, sy + 15, x - 5, sy + 15, x - 0.8, sy + 8], "rgba(255,230,180,.35)");
          const f = ev.on ? Math.max(0, ev.left / ev.limit) : 1; poly(c, [x - 4 * f, sy + 7 - 5 * f, x + 4 * f, sy + 7 - 5 * f, x, sy + 8], "#e5b454"); poly(c, [x - 4, sy + 14, x + 4, sy + 14, x, sy + 14 - 5 * (1 - f)], "#e5b454");
          c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, sy + 8, 14 + Math.sin(t * 3) * 2, "rgba(255,200,100,.35)"); c.restore();
        }
        if (ev.on) for (const r of ev.rings) if (!r.got) { const b = Math.sin(t * 4 + r.x) * 2; c.save(); c.globalCompositeOperation = "lighter"; glow(c, r.x, r.y + b, 13, "rgba(255,210,120,.45)"); c.restore(); c.strokeStyle = "#ffd27a"; c.lineWidth = 2; c.beginPath(); c.ellipse(r.x, r.y + b, 5 + Math.sin(t * 5) * 1.5, 7, 0, 0, 6.283); c.stroke(); }
      }
      if (ev.k === "rune" && !ev.done) { const b = Math.sin(t * 2) * 2; c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 12 + b, 16, "rgba(220,200,255,.55)"); c.restore(); poly(c, [x, y - 20 + b, x + 5, y - 12 + b, x, y - 4 + b, x - 5, y - 12 + b], "#d8d0e8"); poly(c, [x, y - 17 + b, x + 2.5, y - 12 + b, x, y - 7 + b, x - 2.5, y - 12 + b], "#c03a5a"); }
    }
    /* Riss im Netz */
    const lv = Z.level; if (lv && lv.rift) { const r = lv.rift, P = Z.player;
      if (P && Math.abs(P.x + P.w / 2 - r.x) < 40 && Math.abs(P.y + P.h - r.y) < 40) { if (Z.ui && Z.ui.worldLabel) Z.ui.worldLabel("riss", { x: r.x, y: r.y - 54, html: (Z.ui.key("use") || "✋") + " " + esc(L(["Hindurchgehen", "Step through"])), art: "magie", jetzt: true }); }
      c.save(); c.globalCompositeOperation = "lighter"; glow(c, r.x, r.y - 20, 34 + Math.sin(t * 4) * 4, "rgba(200,60,110,.5)"); c.restore(); c.strokeStyle = "rgba(230,220,240,.8)"; c.lineWidth = 0.7; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + t * 0.3; c.beginPath(); c.moveTo(r.x, r.y - 20); c.lineTo(r.x + Math.cos(a) * 22, r.y - 20 + Math.sin(a) * 26); c.stroke(); } ell(c, r.x, r.y - 20, 6, 16, "#120810"); }
  }
  const hz0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (hz0) hz0(c, t); drawEvents(c, t); try { drawHelfer(c, t); drawBrocken(c); } catch (err) { console.error(err); } };

  /* ======================= DAS WAHRE ENDE ======================= */
  Z.ARENAS.herz = { tier: 7, boss: "weberin", final: "wahr", name: ["Das Herz der Fäden", "The Heart of Threads"], base: "schlund", exits: [], music: "final", w: 56, h: 20, kind: "lab" };
  const B = Z.BOSSDEF, pickMv = (b, ids) => { const o = {}; for (const id of ids) if (B[b] && B[b].moves[id]) o[id] = B[b].moves[id]; return o; };
  const summonSp = (e, n) => { for (let i = 0; i < n; i++) { const m = Z.spawnEnemy("spinnchen", e.x + e.w / 2 + (i - (n - 1) / 2) * 26, e.y + e.h - 4, { tier: e.tier }); if (m) { m.aware = true; m.master = e; m.spawnT = 0.4; } } };
  B.weberin = Object.assign({}, { boss: true, poise: 99, heavy: true, sight: 999, atks: [], update: B.riese.update }, {
    n: ["Die Weberin", "The Weaver"], title: ["Die die Fäden spann", "Who Spun the Threads"], shape: "spider", c: "#2a1a2a", t: "#c03a5a", w: 58, h: 30, size: 3.1, hp: 78, dmg: 1.4, spd: 70, idleT: 0.45, demon: true,
    intro: ["Acht Augen öffnen sich im Dunkel. „Du hast meine Fäden durchtrennt, Zerstörer. Alle drei. Wie … aufmerksam.“", "Eight eyes open in the dark. \"You've cut my threads, Destroyer. All three. How… thoughtful.\""],
    outro: ["Die Weberin zerfällt zu Seide und Staub. Das ganze Netz der Feste erschlafft, Faden um Faden.", "The Weaver falls apart into silk and dust. The keep's entire web goes slack, thread by thread."],
    phases: [{ at: 1, moves: ["stampf", "strahl", "felswurf", "brut", "netzfaecher"] }, { at: 0.6, moves: ["stampf", "strahl", "runenregen", "brut", "netzfaecher", "erdbeben"], enter: e => { e.rage = true; Z.bossSay && Z.bossSay(L(["„Dann eben ohne Netz.“", "\"Then without a web.\""])); A.play("roar", { vol: 0.8 }); FX.addShake(8); } }, { at: 0.25, moves: ["strahl", "runenregen", "netzfaecher", "erdbeben", "brut", "felswurf"], enter: e => { e.rage = true; e.dmgMul *= 1.2; Z.bossSay && Z.bossSay(L(["„ICH BIN DAS NETZ.“", "\"I AM THE WEB.\""])); A.play("roar", { vol: 1 }); FX.addShake(10); FX.flashScreen("#c03a5a", 0.4); } }],
    moves: Object.assign({}, pickMv("schmiedewaechter", ["stampf", "strahl", "runenregen"]), pickMv("riese", ["felswurf", "erdbeben"]), {
      brut: { pre: 0.7, dur: 0.2, post: 0.6, sfx: "insect", cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 4, act: e => summonSp(e, e.rage ? 4 : 3) },
      netzfaecher: { pre: 0.75, dur: 0.3, post: 0.6, sfx: "web", act: (e, P) => { const cx = e.x + e.w / 2, cy = e.y + e.h * 0.4; for (let i = -2; i <= 2; i++) { const a = Math.atan2(P.y + 10 - cy, P.x + P.w / 2 - cx) + i * 0.22; Z.spawnProj(i % 2 ? "e_netz" : "e_kugel", cx, cy, 1, { vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: e.dmgMul * 0.9, owner: "e" }); } } }
    })
  });
  const WAHR = [["Der letzte Faden", "The Last Thread"], ["Als die Weberin zu Seide zerfällt, wird es in der ganzen Feste still. Kein Summen in den Wänden, kein Ziehen an den Gelenken. Zum ersten Mal seit Jahren gehört Ezekiels Schritt nur ihm selbst.<br><br>Draußen, am Lagerfeuer, schaut Barradin auf. „Du bist … anders.“ Ezekiel zuckt mit den Schultern. Rex wedelt.<br><br><i>Das Netz ist zerrissen. Die Geschichte nicht.</i>", "As the Weaver crumbles into silk, the whole keep falls silent. No humming in the walls, no tugging at the joints. For the first time in years, Ezekiel's steps belong only to him.<br><br>Outside, by the campfire, Barradin looks up. \"You're… different.\" Ezekiel shrugs. Rex wags his tail.<br><br><i>The web is torn. The story is not.</i>"]];
  /* Nach einem Endboss: statt sofort zu enden, kann man durch den Riss gehen */
  function wireEnding() {
    const end0 = Z.ui.ending;
    Z.ui.ending = function (key) {
      if (key !== "wahr" && M().bonus.riss && Z.level && Z.level.riftPending && !Z.level.rift) {
        const P = Z.player; Z.level.rift = { x: P.x + P.w / 2 + 60, y: P.y + P.h };
        Z.toast(L(["Ein Riss im Netz öffnet sich … Hindurchgehen für das wahre Ende – oder warten, und die Geschichte endet hier.", "A rift in the web opens… Step through for the true ending – or wait, and the story ends here."]), 6000);
        Z.level.riftKey = key; Z.level.riftT = 25; return;
      }
      if (pact && npacts() >= 3) Z.grantAch("pakt");
      try { endCheck(); } catch (err) { console.error(err); }
      return end0.apply(this, arguments);
    };
  }
  function riftTick(dt) {
    const lv = Z.level; if (!lv || !lv.rift) return;
    const P = Z.player, r = lv.rift;
    lv.riftT -= dt;
    if (P && Math.abs(P.x + P.w / 2 - r.x) < 22 && Math.abs(P.y + P.h - r.y) < 30 && inp.pressed.use) { inp.consume("use"); lv.rift = null; Z.ui.fade(() => { Z.run.route.push("herz"); Z.loadArea("herz"); }); return; }
    if (lv.riftT <= 0) { const k = lv.riftKey; lv.rift = null; Z.ui.ending(k); }
  }

  /* ======================= Schritt & Verkabelung ======================= */
  Z.abenteuerTick = function (dt) { heroTick(dt); evTick(dt); riftTick(dt); try { trackTick(dt); helferTick(dt); varTick(dt); } catch (err) { console.error(err); } achTick(dt); };
  /* Erfolge II: äußerste Wrapper (erst nach allen Dateien), damit sie das Endergebnis sehen */
  function wireAch() {
    buildDyn();
    const k0 = Z.killEnemy;
    Z.killEnemy = function (e, o) {
      const was = !!(e && e.dead); const r = k0.apply(this, arguments);
      try { if (e && e.dead && !was && !e._achK && !e.dummy) { e._achK = 1; onKill(e, o || {}); } } catch (err) { console.error(err); }
      return r;
    };
    const h0 = Z.hitEnemy;
    Z.hitEnemy = function (e, dmg, o) {
      const s0 = e ? e.surpN || 0 : 0; const r = h0.apply(this, arguments);
      try { if (e && (e.surpN || 0) > s0) { const A2 = RA(); if (A2) A2.surp++; } } catch (_) {}
      return r;
    };
    const l0 = Z.loadArea;
    Z.loadArea = function (id, opts) {
      try { areaDone(id, opts); } catch (err) { console.error(err); }
      const r = l0.apply(this, arguments);
      lvLoaded = Z.level;
      try { const lv = Z.level; if (Z.run && lv && TEMPO[lv.id] && !lv.arena && !lv.passage) { const x = X(); if (!x.bio[lv.id]) { x.bio[lv.id] = 1; Z.saveMeta(); } } } catch (_) {}
      return r;
    };
  }
  function late() {
    if (!Z.ui || !Z.ui.actions || !Z.TX) return setTimeout(late, 50); wire(); wireEnding(); wireAch(); Z.TX.endings.wahr = WAHR;
    /* W13 R18: Lager-Zusatzstufen, die die neuen Lauf-Elemente stärken (Werte als Vorschlag für Balance) */
    if (Z.lager && Z.lager.addUpgrade) {
      Z.lager.addUpgrade("quirin", "quellwasser", { n: ["Quellwasser", "Spring Water"], max: 1, cost: [100], req: () => Z.lager.level("quirin") >= 1,
        d: ["Quirin zeigt dir, welche Kräuter man in Heilquellen mischt: Trinken heilt 60 % statt 40 %.", "Quirin shows you which herbs to mix into healing springs: drinking heals 60% instead of 40%."] });
      Z.lager.addUpgrade("jori", "funken", { n: ["Funkenschlag", "Spark Strike"], max: 1, cost: [120], req: () => Z.lager.level("jori") >= 1,
        d: ["Jori lehrt dich, Glut zu erkennen: Überreste von Abenteurern geben mit 40 % Schmiedeglut, gelöste Hebelrätsel immer.", "Jori teaches you to spot embers: adventurers' remains give forge embers 40% of the time, solved lever puzzles always."] });
    }
    /* Erfolge auch im Pause-Menü */
    const pause0 = Z.ui.pause;
    Z.ui.pause = function () { const r = pause0.apply(this, arguments); const k = document.querySelector("#modal .pausenmenue .knoepfe") || (document.querySelector("#modal .pausenmenue") ? document.querySelector("#modal .knoepfe") : null); if (k && !k.querySelector('[data-act="abAchP"]')) { const b = document.createElement("button"); b.dataset.act = "abAchP"; b.textContent = "🏆 " + L(["Erfolge", "Achievements"]); k.insertBefore(b, k.children[2] || null); } return r; };
    Z.ui.actions.abAchP = () => { Z.ui.close(); achModal(false); };
  }
  late();
})();
