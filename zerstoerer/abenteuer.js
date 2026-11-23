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
  Z.hasPact = pact;
  const npacts = () => (Z.run && Z.run.pacts ? Z.run.pacts.length : 0);

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
  function rewardText(r) { if (r.cape) return L(["Umhang: ", "Cape: "]) + L(CAPES[r.cape].n); if (r.hero) return L(["Neuer Held: ", "New hero: "]) + L(HEROES[r.hero].n); if (r.bonus) return L(BONUS[r.bonus]); return ""; }
  function grant(a) {
    const m = M(); if (m.ach[a.id]) return; m.ach[a.id] = Date.now();
    if (a.r.cape) m.capes[a.r.cape] = 1; if (a.r.hero) m.heroes[a.r.hero] = 1; if (a.r.bonus) m.bonus[a.r.bonus] = 1;
    Z.saveMeta(); A.play("holy", { vol: 0.6 });
    if (Z.ui && Z.ui.notify) Z.ui.notify("🏆 <b>" + L(["Erfolg: ", "Achievement: "]) + esc(L(a.n)) + "</b><br><small>" + esc(rewardText(a.r)) + "</small>", { prio: 1, art: "sieg", dauer: 3600 }); else Z.toast && Z.toast("🏆 <b>" + esc(L(a.n)) + "</b>", 4200);
  }
  let achT = 0;
  function achTick(dt) { achT -= dt; if (achT > 0) return; achT = 1; for (const a of ACH) if (!M().ach[a.id]) { let ok = false; try { ok = a.ok(); } catch (_) {} if (ok) { grant(a); break; } } }
  Z.grantAch = id => { const a = ACH.find(x => x.id === id); if (a) grant(a); };

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
      "<h3>" + L(["Held", "Hero"]) + '</h3><div class="wahlen">' + heroes + "</div>" +
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
    ui().startRunConfirm = () => { sel = null; startModal(); };
  }
  function achModal(fromStart) {
    const m = M(), done = ACH.filter(a => m.ach[a.id]).length;
    const rows = ACH.map(a => '<div class="erfolg' + (m.ach[a.id] ? " ja" : "") + '"><b>' + (m.ach[a.id] ? "🏆 " : "· ") + esc(L(a.n)) + "</b><span>" + esc(L(a.d)) + "</span><small>" + esc(rewardText(a.r)) + "</small></div>").join("");
    const runes = ["tiefe", "glut", "himmel"].map(k => (m.runes[k] ? "◆" : "◇")).join(" ");
    ui().open("<h2>" + L(["Erfolge", "Achievements"]) + " <small>" + done + "/" + ACH.length + '</small></h2><p class="hinweis">' + L(["Runen-Fragmente: ", "Rune fragments: "]) + runes + " · " + L(["versteckt in Geheimräumen der Verliese, der Schmiede und der Zinnen", "hidden in secret rooms of the dungeons, the forge and the spires"]) + '</p><div class="erfolge">' + rows + '</div><div class="knoepfe"><button data-act="abAchBack" data-arg="' + (fromStart ? "start" : "") + '" autofocus>' + L(["Zurück", "Back"]) + "</button></div>", { cls: "breit" });
  }
  Z.achModal = achModal;

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
    const e = spawn0(id, x, y, o);
    if (e && !e.def.boss) {
      if (pact("raserei")) e.def = Object.assign({}, e.def, { spd: (e.def.spd || 80) * 1.3 });
      if (pact("blutzoll")) e.dmgMul *= 1.5;
    }
    if (e && e.def.boss && pact("blutzoll")) e.dmgMul *= 1.25;
    return e;
  };
  const roll0 = Z.rollItem;
  Z.rollItem = function (o) { o = Object.assign({}, o || {}); const n = npacts(); if (n) { const r = (o.rar || [70, 24, 5, 1]).slice(); r[0] /= 1 + 0.35 * n; r[2] *= 1 + 0.2 * n; r[3] *= 1 + 0.25 * n; o.rar = r; } return roll0(o); };

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
    if (dg > 0) { if (h === "B") P.gold += Math.round(dg * 0.5); if (h === "E") Z.healPlayer(Math.max(1, dg * 0.08)); M().totalGold += dg; }
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
    for (const k of plan) {
      const p = spotFar(lv, lv.start, k === "haendler" ? 18 : 30); if (!p) continue;
      const x = p.x * T + 8, y = (p.y + 1) * T;
      if (k === "dieb") { const e = Z.spawnEnemy("goblin", x, y); if (e) { e.thief = true; e.hpMax = e.hp = Math.round(e.hpMax * 2.5); e.def = Object.assign({}, e.def, { spd: 135, atks: [] }); e.t0 = 0; evs.push({ k, e, x, y, done: false }); } }
      else evs.push({ k, x, y, done: false, t: 0 });
    }
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
  Z.loadArea = function (id) { const r = load0.apply(this, arguments); try { setupEvents(Z.level); } catch (err) { console.error(err); } return r; };
  function near(ev, d) { const P = Z.player; return P && Math.abs(P.x + P.w / 2 - ev.x) < (d || 22) && Math.abs(P.y + P.h - ev.y) < 26; }
  function finish(ev) { ev.done = true; M().events = (M().events || 0) + 1; if (Z.run) Z.run.events++; Z.saveMeta(); }
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
        case "kaefig": if (near(ev, 26) && use) { inp.consume("use"); finish(ev); A.play("chain", { vol: 0.8 }); FX.burst(ev.x, ev.y - 10, 18, { col: ["#9a8a7a", "#5a4a40"], sp: 120, life: 0.5, size: 2.4, kind: "shard", g: 500 }); Z.dropShards(ev.x, ev.y - 8, 25); Z.toast(L(["„Danke, Gehörnter! Nimm das – Nundro wird staunen.“", "\"Thanks, horned one! Take this – Nundro will be amazed.\""]), 3000); } break;
        case "wette":
          if (!ev.on && near(ev, 26) && use) { inp.consume("use"); ev.on = true; ev.left = 30; ev.hp0 = P.dmgTaken; ev.k0 = Z.stats.kills || 0; Z.toast(L(["Barradin: „30 Sekunden, drei Kills, kein Kratzer. Ich wette meine Laute dagegen.“", "Barradin: \"30 seconds, three kills, not a scratch. I bet my lute you can't.\""]), 3600); }
          else if (ev.on) {
            const sec = Math.ceil(ev.left); ev.left -= dt; if (Math.ceil(ev.left) !== sec) FX.text(P.x + P.w / 2, P.y - 18, sec - 1 + " s · " + Math.max(0, 3 - ((Z.stats.kills || 0) - ev.k0)) + L([" Kills", " kills"]), "#ffc24a");
            if (P.dmgTaken > ev.hp0) { ev.on = false; finish(ev); Z.toast(L(["Barradin: „Ha! Ein Kratzer! Die Laute bleibt bei mir.“", "Barradin: \"Ha! A scratch! The lute stays with me.\""]), 3000); A.play("laugh", { vol: 0.5 }); }
            else if ((Z.stats.kills || 0) - ev.k0 >= 3 && ev.left <= 0 || ((Z.stats.kills || 0) - ev.k0 >= 3 && ev.left < 25)) { ev.on = false; finish(ev); M().betWon = 1; Z.dropItem(P.x + P.w / 2, P.y, { boss: true }); P.gold += 150; Z.toast(L(["Barradin: „… gut. GUT. Nimm. Und erzähl es niemandem.“", "Barradin: \"…fine. FINE. Take it. And tell no one.\""]), 3200); A.play("holy", { vol: 0.5 }); }
            else if (ev.left <= 0) { ev.on = false; finish(ev); Z.toast(L(["Barradin: „Zu langsam. Die Ballade wird kürzer.“", "Barradin: \"Too slow. The ballad gets shorter.\""]), 3000); }
          }
          break;
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
      if (ev.k === "rune" && !ev.done) { const b = Math.sin(t * 2) * 2; c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 12 + b, 16, "rgba(220,200,255,.55)"); c.restore(); poly(c, [x, y - 20 + b, x + 5, y - 12 + b, x, y - 4 + b, x - 5, y - 12 + b], "#d8d0e8"); poly(c, [x, y - 17 + b, x + 2.5, y - 12 + b, x, y - 7 + b, x - 2.5, y - 12 + b], "#c03a5a"); }
    }
    /* Riss im Netz */
    const lv = Z.level; if (lv && lv.rift) { const r = lv.rift, P = Z.player;
      if (P && Math.abs(P.x + P.w / 2 - r.x) < 40 && Math.abs(P.y + P.h - r.y) < 40) { if (Z.ui && Z.ui.worldLabel) Z.ui.worldLabel("riss", { x: r.x, y: r.y - 54, html: (Z.ui.key("use") || "✋") + " " + esc(L(["Hindurchgehen", "Step through"])), art: "magie", jetzt: true }); }
      c.save(); c.globalCompositeOperation = "lighter"; glow(c, r.x, r.y - 20, 34 + Math.sin(t * 4) * 4, "rgba(200,60,110,.5)"); c.restore(); c.strokeStyle = "rgba(230,220,240,.8)"; c.lineWidth = 0.7; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + t * 0.3; c.beginPath(); c.moveTo(r.x, r.y - 20); c.lineTo(r.x + Math.cos(a) * 22, r.y - 20 + Math.sin(a) * 26); c.stroke(); } ell(c, r.x, r.y - 20, 6, 16, "#120810"); }
  }
  const hz0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (hz0) hz0(c, t); drawEvents(c, t); };

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
  Z.abenteuerTick = function (dt) { heroTick(dt); evTick(dt); riftTick(dt); achTick(dt); };
  function late() {
    if (!Z.ui || !Z.ui.actions || !Z.TX) return setTimeout(late, 50); wire(); wireEnding(); Z.TX.endings.wahr = WAHR;
    /* Erfolge auch im Pause-Menü */
    const pause0 = Z.ui.pause;
    Z.ui.pause = function () { const r = pause0.apply(this, arguments); const k = document.querySelector("#modal .pausenmenue .knoepfe") || (document.querySelector("#modal .pausenmenue") ? document.querySelector("#modal .knoepfe") : null); if (k && !k.querySelector('[data-act="abAchP"]')) { const b = document.createElement("button"); b.dataset.act = "abAchP"; b.textContent = "🏆 " + L(["Erfolge", "Achievements"]); k.insertBefore(b, k.children[2] || null); } return r; };
    Z.ui.actions.abAchP = () => { Z.ui.close(); achModal(false); };
  }
  late();
})();
