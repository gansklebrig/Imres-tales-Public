/* Ezekiel – The Destroyer · Oberfläche
   HUD, Menüs (Titel, Pause, Einstellungen, Schmiede, Fundbuch, Schädelaltar, Händler, Segen, Schriftrollen), Touch-Steuerung, Enden. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, A = Z.audio, inp = Z.input, L = v => Z.L(v), esc = U.esc;
  const $ = s => document.querySelector(s);
  const ui = (Z.ui = { modalOpen: false, choiceActive: null });
  const en = () => Z.settings.lang === "en";

  /* ======================= TEXTE ======================= */
  const TX = {
    title: ["Ezekiel", "Ezekiel"], sub: ["The Destroyer · Die Feste der Fäden", "The Destroyer · The Keep of Threads"],
    play: ["Ins Lager", "To the camp"], cont: ["Weiter", "Continue"], settings: ["Einstellungen", "Settings"], tavern: ["Zur Taverne", "Back to the tavern"],
    pause: ["Pause", "Paused"], resume: ["Weiter", "Resume"], abort: ["Lauf aufgeben", "Abandon run"], camp: ["Zurück ins Lager", "Back to camp"],
    close: ["Schließen", "Close"], back: ["Zurück", "Back"], yes: ["Ja", "Yes"], no: ["Nein", "No"],
    intro: ["Barradin erzählt:<br><br>Eines Nachts war Ezekiels Platz am Feuer leer. Nur ein Brief lag dort, versiegelt mit einer Spinne aus schwarzem Wachs: <i>„The Destroyer. Die Spinne erwartet dich.“</i><br><br>Am Horizont stand eine Feste, die am Abend noch nicht dagewesen war. Fäden spannten sich von ihren Türmen bis in die Wolken, und in ihren Hallen warteten alle, die wir je besiegt haben. Oder etwas, das so aussah.<br><br>Ezekiel ging hinein. Ohne Waffe. Natürlich.",
      "Barradin tells:<br><br>One night Ezekiel's place by the fire was empty. Only a letter lay there, sealed with a spider of black wax: <i>'The Destroyer. The Spider awaits you.'</i><br><br>On the horizon stood a keep that had not been there that evening. Threads stretched from its towers into the clouds, and in its halls waited everyone we had ever defeated. Or something that looked like them.<br><br>Ezekiel went in. Without a weapon. Of course."],
    startRun: ["Die Feste betreten?", "Enter the keep?"], startRunTxt: ["Du beginnst mit leeren Händen. Alles, was du findest, bleibt nur für diesen Lauf. Seelensplitter, die du in Durchgängen ablieferst, bleiben.", "You begin empty-handed. Everything you find lasts only for this run. Soul shards delivered at passages are kept."],
    go: ["Hinein", "Go in"],
    died: ["Gefallen", "Fallen"], diedSub: ["„Noch nicht“ war es diesmal nicht.", "This time it wasn't 'not yet'."],
    kills: ["Erschlagen", "Slain"], time: ["Zeit", "Time"], gold: ["Gold", "Gold"], shardsKept: ["Splitter im Lager", "Shards in camp"], shardsLost: ["Splitter verloren", "Shards lost"], reached: ["Erreicht", "Reached"], parries: ["Paraden", "Parries"], secrets: ["Geheimgänge", "Secrets"],
    replace: ["Ersetzen", "Replace"], cancel: ["Abbrechen", "Cancel"], take: ["Aufheben", "Pick up"], open: ["Öffnen", "Open"], read: ["Lesen", "Read"], eat: ["Essen", "Eat"], enter: ["Betreten", "Enter"], talk: ["Reden", "Talk"], use: ["Benutzen", "Use"],
    scrollT: ["Schriftrolle der Macht", "Scroll of Power"], scrollD: ["Wähle, was wachsen soll. Jede Rolle gibt auch mehr Leben.", "Choose what grows. Every scroll also grants more health."],
    forge: ["Nundros Schmiede", "Nundro's Forge"], codex: ["Barradins Fundbuch", "Barradin's Ledger"], skullT: ["Schädelaltar", "Skull Altar"],
    shop: ["Händler", "Merchant"], altar: ["Segensaltar", "Altar of Blessings"], fountain: ["Brunnen", "Fountain"],
    buy: ["Kaufen", "Buy"], sold: ["Verkauft", "Sold"], noGold: ["Zu wenig Gold.", "Not enough gold."], noShards: ["Zu wenige Splitter.", "Not enough shards."],
    shards: ["Seelensplitter", "Soul shards"], level: ["Stufe", "Level"], upgrade: ["Schärfen", "Sharpen"], luck: ["Fundglück", "Find luck"], max: ["Meister", "Master"],
    unknown: ["??? – noch nie gefunden", "??? – never found"], findChance: ["Fundchance", "Find chance"], from: ["ab", "from"],
    tabsForge: [["Waffen", "Fähigkeiten", "Lager"], ["Weapons", "Skills", "Camp"]], tabsCodex: [["Waffen", "Fähigkeiten", "Gegner", "Bosse", "Enden", "Statistik"], ["Weapons", "Skills", "Enemies", "Bosses", "Endings", "Stats"]],
    ups: { trank: [["Zusätzlicher Heiltrank", "Extra healing potion"], ["Eine Ladung mehr pro Lauf.", "One more charge per run."]], zaeh: [["Zähigkeit", "Toughness"], ["+10 Leben pro Stufe.", "+10 health per level."]], klingen: [["Geschliffene Klingen", "Honed blades"], ["+5 % Schaden pro Stufe.", "+5% damage per level."]], haendler: [["Händlergunst", "Merchant's favour"], ["Händler verlangen 10 % weniger.", "Merchants charge 10% less."]] },
    tut: ["Steuerung", "Controls"],
    ctrlKeys: ["<b>A/D</b> laufen · <b>Leertaste</b> springen (zweimal: Doppelsprung) · <b>Shift</b> rollen (unverwundbar)<br><b>J</b> / Linksklick: Waffe 1 · <b>U</b> / Rechtsklick: Waffe 2 · <b>Q</b> und <b>O</b>: Fähigkeiten<br><b>R</b> Heiltrank · <b>E</b> benutzen / aufheben · <b>W</b> Leiter hoch · <b>S + Leertaste</b> durch Stege fallen<br><b>S + Angriff</b> in der Luft: Sturzangriff · <b>M</b> Karte · <b>Esc</b> Pause",
      "<b>A/D</b> move · <b>Space</b> jump (twice: double jump) · <b>Shift</b> roll (invulnerable)<br><b>J</b> / left click: weapon 1 · <b>U</b> / right click: weapon 2 · <b>Q</b> and <b>O</b>: skills<br><b>R</b> healing potion · <b>E</b> use / pick up · <b>W</b> climb ladder · <b>S + Space</b> drop through ledges<br><b>S + attack</b> in the air: plunge · <b>M</b> map · <b>Esc</b> pause"],
    ctrlPad: ["<b>A</b> springen · <b>B</b> rollen · <b>X</b> Waffe 1 · <b>Y</b> Waffe 2 · <b>LB/RB</b> Fähigkeiten · <b>LT</b> Trank · <b>RT</b> benutzen · <b>Select</b> Karte · <b>Start</b> Pause", "<b>A</b> jump · <b>B</b> roll · <b>X</b> weapon 1 · <b>Y</b> weapon 2 · <b>LB/RB</b> skills · <b>LT</b> potion · <b>RT</b> use · <b>Select</b> map · <b>Start</b> pause"],
    ctrlTouch: ["Links ziehen: laufen, klettern. Rechts: Springen, Rolle, Waffen, Fähigkeiten, Trank. Das Hand-Symbol hebt auf und öffnet Türen.", "Drag on the left: move, climb. Right: jump, roll, weapons, skills, potion. The hand button picks up and opens doors."],
    tips: [["Leuchtet ein Gegner auf, holt er aus. Rolle hindurch – während der Rolle kann dich nichts treffen.", "When an enemy flashes, it's winding up. Roll through – nothing can hit you mid-roll."],
      ["Rote Doppel-Ausrufezeichen lassen sich nicht blocken. Ausweichen!", "Red double exclamation marks can't be blocked. Dodge!"],
      ["Wer getroffen wurde, kann verlorenes Leben kurz zurückholen: sofort zurückschlagen.", "When you're hit, you can win lost health back for a moment: strike back immediately."],
      ["Rissige Wände lassen sich zerschlagen. Dahinter wartet oft etwas.", "Cracked walls can be smashed. Something often waits behind them."],
      ["Seelensplitter sind erst sicher, wenn ein Durchgang erreicht ist.", "Soul shards are only safe once you reach a passage."],
      ["Jede Waffe hat ihre eigene Bedingung für kritische Treffer. Das Fundbuch weiß mehr.", "Every weapon has its own condition for critical hits. The ledger knows more."]],
    endings: {
      tiefe: [["Der Faden der Tiefe", "The Thread of the Deep"], ["Als Demogorgon versinkt, reißt irgendwo unter dem See ein Faden. Ezekiel steht bis zu den Knien im schwarzen Wasser und sieht den Wellen nach, bis sie still sind.<br><br>Später, am Feuer, will ich wissen, wie es war. Ich frage dreimal.<br>„Nass.“<br><br>Rex legt ihm den Kopf aufs Knie. Ezekiel lässt ihn.", "As Demogorgon sinks, somewhere beneath the lake a thread snaps. Ezekiel stands knee-deep in black water and watches the waves until they are still.<br><br>Later, by the fire, I want to know how it was. I ask three times.<br>'Wet.'<br><br>Rex lays his head on his knee. Ezekiel lets him."]],
      glut: [["Der Faden der Glut", "The Thread of Embers"], ["Themberchaud liegt still auf seinem Gold. Ezekiel steigt über den Hort hinweg, ohne hinzusehen. Fast.<br><br>Eine einzige Münze steckt er ein. Am Feuer drückt er sie Echo in die Hand.<br>„Für die Gruppenkasse.“<br><br>Echo starrt die Münze an, dann Ezekiel, dann wieder die Münze. Er wird sie nie ausgeben.", "Themberchaud lies still upon his gold. Ezekiel steps over the hoard without looking. Almost.<br><br>He pockets a single coin. By the fire he presses it into Echo's hand.<br>'For the group fund.'<br><br>Echo stares at the coin, then at Ezekiel, then at the coin again. He will never spend it."]],
      himmel: [["Der Faden des Himmels", "The Thread of the Sky"], ["Oben auf der Turmspitze, über allen Wolken, ist es zum ersten Mal still. Unter Ezekiel zerfasert die Feste wie ein altes Netz im Wind.<br><br>Dann geht die Sonne auf. Eine echte. Er sieht lange hin.<br><br>Friedrich fragt am nächsten Morgen, wo er gewesen sei.<br>„Oben.“", "At the top of the spire, above every cloud, it is quiet for the first time. Beneath Ezekiel the keep frays like an old web in the wind.<br><br>Then the sun rises. A real one. He looks at it for a long time.<br><br>The next morning Friedrich asks where he has been.<br>'Up.'"]],
      alle: [["Drei Fäden", "Three Threads"], ["Drei Fäden sind durchtrennt. Irgendwo im Dunkel zuckt ein Netz zusammen, und jemand, der es gesponnen hat, wird sehr still.<br><br>Ich frage am Feuer noch einmal, wie schon so oft: „Ezekiel. The Destroyer. Woher?“<br><br>Er sieht lange ins Feuer.<br>„Später.“<br><br>Diesmal klingt es wie ein Versprechen. Wer die Spinne wirklich ist? Das erzählt Imre. Irgendwann.", "Three threads are cut. Somewhere in the dark a web twitches, and whoever spun it grows very still.<br><br>By the fire I ask once more, as so often: 'Ezekiel. The Destroyer. Where from?'<br><br>He looks into the fire for a long time.<br>'Later.'<br><br>This time it sounds like a promise. Who the Spider really is? Imre will tell. Someday."]]
    },
    skullDesc: ["Jeder Schädel: Gegner +35 % Leben, +22 % Schaden, dunklere Hallen – aber bessere Beute und mehr Splitter.", "Each skull: enemies +35% health, +22% damage, darker halls – but better loot and more shards."],
    winSkull: ["Ein neuer Schädel hängt an deinem Gürtel.", "A new skull hangs from your belt."]
  };
  Z.TX = TX;
  const t = k => L(TX[k]);

  /* ======================= DOM ======================= */
  const hud = $("#hud"), modal = $("#modal"), toastEl = $("#toast"), banner = $("#banner"), prompt = $("#prompt"), bossbar = $("#bossbar"), choice = $("#choice"), fadeEl = $("#fade"), title = $("#title"), card = $("#card");
  /* Symbol-Leinwände für die vier Plätze */
  const slotEls = {};
  ["a1", "a2", "s1", "s2"].forEach(s => { const el = $("#slot-" + s); slotEls[s] = { el, cv: el.querySelector("canvas"), cd: el.querySelector(".cd"), uid: -1, n: el.querySelector(".n"), k: el.querySelector(".k") }; });
  function drawSlot(s, it) {
    const se = slotEls[s], c = se.cv.getContext("2d"), dpr = 2;
    se.cv.width = 40 * dpr; se.cv.height = 40 * dpr; c.scale(dpr, dpr); c.clearRect(0, 0, 40, 40);
    const d = it ? Z.itemDef(it) : s === "a1" ? Z.WEAPONS.faeuste : null;
    se.el.style.setProperty("--rar", it ? Z.RARITY[it.rar].col : "#3d3140");
    se.el.classList.toggle("leer", !d);
    if (d) { Z.drawIcon(c, d.icon, 20, 21, 26, d.col); se.el.title = L(d.n); }
    se.n.textContent = d ? L(d.n) : ""; se.el.classList.add("neu"); clearTimeout(se.nt); se.nt = setTimeout(() => se.el.classList.remove("neu"), 2200);
  }
  /* ======================= HUD ======================= */
  let hudT = 0, mapT = 0;
  function updateHud(dt) {
    const P = Z.player; if (!P || !Z.level) return;
    const hp = Math.max(0, P.hp), mx = P.hpMax;
    $("#hpfill").style.width = (hp / mx * 100) + "%";
    $("#hprally").style.width = (Math.min(mx, hp + P.rally) / mx * 100) + "%";
    $("#hptxt").textContent = Math.ceil(hp) + " / " + mx;
    $("#hpbar").classList.toggle("fluch", P.curse > 0);
    $("#pots").innerHTML = Array.from({ length: P.potMax }, (_, i) => '<i class="' + (i < P.potions ? "voll" : "") + '"></i>').join("");
    $("#gold").textContent = U.fmt(P.gold);
    $("#shards").textContent = U.fmt(P.shards) + (Z.level.hub ? "" : "") ;
    $("#bank").textContent = U.fmt(Z.meta.shards);
    for (const s of ["a1", "a2", "s1", "s2"]) {
      const it = P.slots[s], se = slotEls[s];
      const key = it ? it.uid : s === "a1" ? -2 : -3;
      if (se.uid !== key) { se.uid = key; drawSlot(s, it); }
      let k = 0;
      if (s[0] === "s" && it) k = P.cd[s] / (Z.SKILLS[it.id].cd || 1);
      if (s[0] === "a" && it && P.mag[s] && P.mag[s].t > 0) { P.mag[s].t -= dt; k = P.mag[s].t / Z.WEAPONS[it.id].shoot.reload; if (P.mag[s].t <= 0) P.mag[s].n = Z.WEAPONS[it.id].shoot.mag + (Z.metaLvl(it.id) >= 3 ? 2 : 0); }
      se.cd.style.height = Math.max(0, Math.min(1, k)) * 100 + "%";
      se.el.classList.toggle("aktiv", !!(P.act && P.act.slot === s));
      se.el.classList.toggle("stumm", s[0] === "s" && P.st.silence > 0);
      const lab = inp.label(s); if (se.lab !== lab) { se.lab = lab; se.k.textContent = lab; se.k.hidden = !lab; }
    }
    hudT -= dt;
    if (hudT <= 0) {
      hudT = 0.25;
      $("#bless").innerHTML = P.bless.map(b => '<span title="' + esc(L(Z.BLESS[b].d)) + '" class="k-' + Z.BLESS[b].k + '">' + esc(L(Z.BLESS[b].n)) + "</span>").join("") +
        (P.stats.brut + P.stats.takt + P.stats.ueber ? '<span class="st"><b style="color:' + Z.STATS.brut.col + '">' + P.stats.brut + '</b> <b style="color:' + Z.STATS.takt.col + '">' + P.stats.takt + '</b> <b style="color:' + Z.STATS.ueber.col + '">' + P.stats.ueber + "</b></span>" : "") +
        (P.curse > 0 ? '<span class="fluch">' + L(["Fluch", "Curse"]) + " " + P.curse + "</span>" : "");
      const run = Z.run;
      $("#area").innerHTML = esc(Z.level.hub ? L(Z.biome.name) : Z.level.passage ? t("fountain").replace(/.*/, L(["Durchgang", "Passage"])) : Z.areaName(Z.level.id)) +
        (run ? '<small>' + fmtTime(run.time) + (run.skulls ? " · " + "☠".repeat(run.skulls) : "") + "</small>" : "");
      $("#fps").textContent = Z.settings.fps ? (Z.fps || 0) + " fps" : "";
    }
    /* Boss */
    const b = Z.boss;
    if (b && !Z.bossDefeated && !b.def.noBar) { bossbar.hidden = false; $("#bossfill").style.width = Math.max(0, b.hp / b.hpMax * 100) + "%"; }
    else bossbar.hidden = true;
    /* Interaktions-Hinweis */
    const o = Z.interactTarget;
    if (o && !ui.modalOpen && !ui.choiceActive && !P.dead) {
      const [sx, sy] = worldToScreen(o.type === "pickup" ? o.p.x : (o.d || o.s).x * T + 8, o.type === "pickup" ? o.p.y - 22 : ((o.d || o.s).y + 1) * T - 40);
      prompt.hidden = false; prompt.style.transform = "translate(" + Math.round(sx) + "px," + Math.round(sy) + "px) translate(-50%,-100%)";
      const key = inp.device === "touch" ? "✋" : inp.label("use");
      prompt.innerHTML = '<kbd>' + key + "</kbd> " + esc(promptLabel(o));
      showCard(o);
    } else { prompt.hidden = true; card.hidden = true; }
    /* Karte */
    mapT -= dt; if (mapT <= 0) { mapT = 0.2; drawMinimap(); }
  }
  function promptLabel(o) {
    if (o.type === "pickup") { const p = o.p; if (p.kind === "item") return t("take"); if (p.kind === "scroll") return t("read"); if (p.kind === "food") return t("eat") + ": " + L((p.food || Z.FOOD[0]).n); return t("open"); }
    if (o.type === "door") return o.d.kind === "gate" ? L(["Die Feste der Fäden", "The Keep of Threads"]) : t("enter") + ": " + Z.areaName(o.d.to);
    if (o.type === "npc") return { B: L(["Barradin · Fundbuch", "Barradin · Ledger"]), A: L(["Nundro · Schmiede", "Nundro · Forge"]), G: L(["Friedrich", "Friedrich"]), E: L(["Echo", "Echo"]), C: t("skullT"), F: L(["Lagerfeuer", "Campfire"]), Y: L(["Trainingspuppe", "Training dummy"]), R: "Rex" }[o.s.id] || t("talk");
    if (o.type === "station") return { K: t("fountain"), M: t("shop"), S: t("altar") }[o.s.id] || t("use");
    return t("use");
  }
  function itemCardHTML(it, cmp) {
    const d = Z.itemDef(it), r = Z.RARITY[it.rar], st = Z.STATS[d.stat];
    const kind = it.type === "skill" ? L(["Fähigkeit", "Skill"]) : d.kind === "ranged" ? L(["Fernkampf", "Ranged"]) : d.kind === "shield" ? L(["Schild", "Shield"]) : L(["Nahkampf", "Melee"]);
    const lvl = Z.metaLvl(it.id);
    return (Z.curseCardHTML ? Z.curseCardHTML(it) : "") + '<div class="ic-kopf" style="--rar:' + (it.cursed ? "#c040ff" : r.col) + '"><b>' + esc(L(d.n)) + "</b>" + (lvl ? ' <span class="lv">+' + lvl + "</span>" : "") + '<small>' + esc(L(r.n)) + " · " + kind + ' · <span style="color:' + st.col + '">' + esc(L(st.n)) + "</span> · " + L(["Stufe", "Tier"]) + " " + (it.tier + 1) + "</small></div>" +
      '<p>' + esc(L(d.d)) + "</p>" + (it.aff.length ? '<ul class="aff">' + it.aff.map(a => "<li>" + esc(L(Z.AFFIX[a].n)) + ": " + esc(L(Z.AFFIX[a].d)) + "</li>").join("") + "</ul>" : "") +
      (d.tags ? '<p class="tags">' + d.tags.map(x => "<span>" + esc(x) + "</span>").join("") + "</p>" : "") +
      (lvl >= 3 && d.master ? '<p class="meister">' + esc(L(d.master)) + "</p>" : "") +
      (cmp ? '<p class="mul">' + L(["Kraft", "Power"]) + ": ×" + Z.itemMul(it).toFixed(2) + "</p>" : "");
  }
  function showCard(o) {
    if (o.type !== "pickup" || o.p.kind !== "item") { card.hidden = true; return; }
    const it = o.p.it;
    if (card.dataset.uid !== String(it.uid)) { card.innerHTML = itemCardHTML(it, true); card.dataset.uid = it.uid; }
    const [sx, sy] = worldToScreen(o.p.x, o.p.y - 40);
    card.hidden = false;
    const w = card.offsetWidth, h = card.offsetHeight;
    card.style.transform = "translate(" + Math.round(U.clamp(sx - w / 2, 8, innerWidth - w - 8)) + "px," + Math.round(U.clamp(sy - h - 24, 60, innerHeight - h - 8)) + "px)";
  }
  const cvEl = document.getElementById("cv");
  function worldToScreen(x, y) { const k = Z.gfx.scale / (cvEl.width / (cvEl.clientWidth || 1)); return [(x - Z.cam.x) * k, (y - Z.cam.y) * k]; }
  const fmtTime = s => { s = Math.floor(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  /* ======================= KARTE ======================= */
  const mm = $("#minimap"), mmc = mm.getContext("2d");
  let bigMap = false;
  function drawMinimap() {
    const lv = Z.level; if (!lv || !Z.explored) return;
    const big = bigMap;
    mm.classList.toggle("gross", big);
    const P = Z.player, scale = big ? Math.min(innerWidth * 0.8 / lv.W, innerHeight * 0.7 / lv.H) : 2;
    const vw = big ? lv.W : 70, vh = big ? lv.H : 40;
    mm.width = Math.ceil(vw * scale); mm.height = Math.ceil(vh * scale);
    const ox = big ? 0 : U.clamp(Math.floor((P.x + P.w / 2) / T) - vw / 2, 0, Math.max(0, lv.W - vw)), oy = big ? 0 : U.clamp(Math.floor((P.y + P.h / 2) / T) - vh / 2, 0, Math.max(0, lv.H - vh));
    mmc.fillStyle = "rgba(12,8,12,.75)"; mmc.fillRect(0, 0, mm.width, mm.height);
    for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
      const tx = x + ox, ty = y + oy; if (tx >= lv.W || ty >= lv.H) continue;
      if (!Z.explored[ty * lv.W + tx] && !lv.hub && !lv.passage) continue;
      const v = lv.get(tx, ty);
      mmc.fillStyle = v === 1 ? "#5a4a44" : v === 7 ? "#7a5a3a" : v === 2 || v === 8 ? "#8a6a40" : v === 4 ? "#a08050" : v === 3 ? "#a04040" : v === 5 ? "#ff6a1a" : v === 6 ? "#2a5a4a" : "rgba(40,30,36,.8)";
      mmc.fillRect(x * scale, y * scale, scale, scale);
    }
    for (const d of lv.doors) if (d.kind === "exit" && (Z.explored[d.y * lv.W + d.x] || big)) { mmc.fillStyle = "#ffd27a"; mmc.fillRect((d.x - ox) * scale - 1, (d.y - oy) * scale - 2, scale + 2, scale + 3); }
    for (const p of Z.pickups) if ((p.kind === "item" || p.kind === "chest" || p.kind === "scroll") && Z.explored[Math.floor(p.y / T - 1) * lv.W + Math.floor(p.x / T)]) { mmc.fillStyle = p.kind === "scroll" ? "#ffd27a" : "#7fd36a"; mmc.fillRect((p.x / T - ox) * scale - 1, (p.y / T - 1 - oy) * scale - 1, 3, 3); }
    mmc.fillStyle = "#ff5a3a"; mmc.fillRect(((P.x + P.w / 2) / T - ox) * scale - 2, ((P.y + P.h / 2) / T - oy) * scale - 2, 4, 4);
  }

  /* ======================= MELDUNGEN ======================= */
  let toastT = null;
  Z.toast = ui.toast = (msg, ms) => { toastEl.innerHTML = msg; toastEl.hidden = false; toastEl.classList.remove("weg"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.add("weg"), ms || 2600); };
  let bannerT = null;
  ui.banner = (big, small, ms) => { banner.innerHTML = "<b>" + esc(big) + "</b>" + (small ? "<small>" + esc(small) + "</small>" : ""); banner.hidden = false; banner.classList.remove("weg"); void banner.offsetWidth; banner.classList.add("an"); clearTimeout(bannerT); bannerT = setTimeout(() => { banner.classList.remove("an"); banner.classList.add("weg"); }, ms || 3200); };
  Z.bossSay = msg => ui.toast("<i>" + esc(msg) + "</i>", 2200);
  ui.onArea = (id, B, lv) => {
    hud.hidden = false; title.hidden = true;
    if (lv.hub) ui.banner(L(B.name), L(["Hier beginnt jeder Lauf. Mit leeren Händen.", "Every run begins here. Empty-handed."]));
    else if (lv.passage) ui.banner(L(["Durchgang", "Passage"]), L(["Weiter nach: ", "Onward to: "]) + Z.areaName(lv.to));
    else if (lv.arena) ui.banner(Z.areaName(id), "");
    else ui.banner(L(B.name), L(B.sub) + (B.story ? " – " + L(B.story) : ""), 4200);
    card.hidden = true; prompt.hidden = true;
    touchSync();
  };
  ui.bossIntro = e => {
    $("#bossname").innerHTML = esc(L(e.def.n)) + (e.def.title ? "<small>" + esc(L(e.def.title)) + "</small>" : "");
    ui.banner(L(e.def.n), e.def.intro ? L(e.def.intro) : L(e.def.title || ["", ""]), 4200);
  };
  ui.bossDown = b => { setTimeout(() => ui.banner(L(["Besiegt", "Defeated"]) + ": " + L(b.def.n), b.def.outro ? L(b.def.outro) : "", 6000), 700); };

  /* ======================= ÜBERBLENDE ======================= */
  ui.fade = fn => { fadeEl.classList.add("an"); setTimeout(() => { try { fn(); } finally { setTimeout(() => fadeEl.classList.remove("an"), 60); } }, 380); };

  /* ======================= MODALE ======================= */
  let modalStack = [];
  function openModal(html, opts) {
    opts = opts || {};
    modal.innerHTML = '<div class="mbox ' + (opts.cls || "") + '">' + html + "</div>";
    modal.hidden = false; ui.modalOpen = true; Z.paused = true; ui.onClose = opts.onClose || null; ui.noEsc = !!opts.noEsc;
    A.muffle(1600);
    setTimeout(() => { const f = modal.querySelector("[autofocus]") || modal.querySelector("button:not([disabled]),input"); if (f) f.focus(); }, 30);
  }
  function closeModal() {
    if (!ui.modalOpen) return;
    modal.hidden = true; modal.innerHTML = ""; ui.modalOpen = false; Z.paused = false; A.muffle(20000);
    const cb = ui.onClose; ui.onClose = null; if (cb) cb();
  }
  ui.close = closeModal; ui.open = openModal; Z.TX = TX;
  modal.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (!b) return; const fn = actions[b.dataset.act]; if (fn) { A.play("ui", { vol: 0.35 }); fn(b.dataset.arg, b); } });
  const actions = {}; ui.actions = actions;
  /* Tastatur in Menüs */
  ui.onKey = e => {
    if (inp.capture) return false;
    if (!title.hidden && (e.code === "Enter" || e.code === "Space")) { const b = title.querySelector("button:focus") || title.querySelector("button"); if (b) { b.click(); return true; } }
    if (!ui.modalOpen) {
      if ((e.code === "KeyM" || e.code === "Tab") && Z.level) { bigMap = !bigMap; drawMinimap(); return true; }
      return false;
    }
    if (e.code === "Escape" || e.code === "KeyP") { if (!ui.noEsc) closeModal(); return true; }
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code) && adjustField(document.activeElement, /Right|KeyD/.test(e.code) ? 1 : -1)) return true;
    if (e.code === "Tab") { moveFocus(e.shiftKey ? -1 : 1); return true; }
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "KeyW", "KeyS", "KeyA", "KeyD"].includes(e.code)) { if (document.activeElement && document.activeElement.tagName === "TEXTAREA" && /Arrow/.test(e.code)) return false; const d = /Down|KeyS/.test(e.code) ? [0, 1] : /Up|KeyW/.test(e.code) ? [0, -1] : /Right|KeyD/.test(e.code) ? [1, 0] : [-1, 0]; moveDir(d[0], d[1]); return true; }
    if (e.code === "Enter" || e.code === "Space" || e.code === "KeyE" || e.code === "KeyJ") { const f = document.activeElement; if (f && modal.contains(f)) { if (f.tagName === "INPUT" && f.type === "range") return false; f.click(); } return true; }
    return true;
  };
  /* Regler und Auswahllisten mit Links/Rechts verstellen (Tastatur und Controller) */
  function adjustField(f, d) {
    if (!f || !modal.contains(f)) return false;
    if (f.tagName === "INPUT" && f.type === "range") { const mn = +f.min || 0, mx = +f.max || 100, st = Math.max(+f.step || 1, (mx - mn) / 20); f.value = Math.max(mn, Math.min(mx, +f.value + d * st)); f.dispatchEvent(new Event("input", { bubbles: true })); f.dispatchEvent(new Event("change", { bubbles: true })); return true; }
    if (f.tagName === "SELECT") { const n = f.options.length; f.selectedIndex = (f.selectedIndex + d + n) % n; f.dispatchEvent(new Event("change", { bubbles: true })); return true; }
    return false;
  }
  const focusables = () => [...modal.querySelectorAll("button:not([disabled]),input,select,a.btn,textarea")].filter(el => el.offsetParent !== null || el === document.activeElement);
  function focusEl(el) { if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView && el.scrollIntoView({ block: "nearest", inline: "nearest" }); A.play("ui", { vol: 0.12, rate: 1.5, gap: 0.03 }); }
  /* sicherstellen, dass etwas im Menü ausgewählt ist (Controller kann sonst „ins Leere“ drücken) */
  function ensureFocus() {
    const f = document.activeElement;
    if (f && modal.contains(f) && f !== modal) return f;
    const el = modal.querySelector("[autofocus]") || focusables()[0];
    if (el) el.focus({ preventScroll: true });
    return el;
  }
  ui.ensureFocus = ensureFocus;
  function moveFocus(d) {
    const list = focusables();
    if (!list.length) return;
    let i = list.indexOf(document.activeElement); i = i < 0 ? 0 : (i + d + list.length) % list.length; focusEl(list[i]);
  }
  /* räumliche Navigation: nächstes Element in Richtung (dx, dy) – angenehm in Rastern (Schmiede, Fundbuch, Laden) */
  function moveDir(dx, dy) {
    const list = focusables(), cur = document.activeElement;
    if (!cur || !list.includes(cur)) { focusEl(ensureFocus()); return; }
    const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bs = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect(), ex = r.left + r.width / 2, ey = r.top + r.height / 2;
      const px = (ex - cx) * dx + (ey - cy) * dy; /* Abstand in Richtung */
      const edge = dx ? (dx > 0 ? r.left - r0.right : r0.left - r.right) : (dy > 0 ? r.top - r0.bottom : r0.top - r.bottom);
      if (px <= 2 || edge < -Math.min(r.width, r.height, r0.width, r0.height) * 0.5) continue;
      const ortho = dx ? Math.max(0, Math.abs(ey - cy) - (r.height + r0.height) / 2) : Math.max(0, Math.abs(ex - cx) - (r.width + r0.width) / 2);
      const sc = Math.max(0, edge) + ortho * 2.5 + Math.abs(px) * 0.05;
      if (sc < bs) { bs = sc; best = el; }
    }
    if (best) focusEl(best);
    else if (dy) moveFocus(dy); /* am Rand: der Reihe nach weiter (umlaufend) */
  }
  ui.moveDir = moveDir;

  /* ---------- Titel ---------- */
  function showTitle() {
    title.hidden = false; hud.hidden = true;
    title.innerHTML = '<div class="tbox"><div class="ttl">' + esc(t("title")) + '</div><div class="tsub">' + esc(t("sub")) + '</div>' +
      '<div class="tbtn"><button id="t-play" autofocus>' + esc(t("play")) + '</button><button id="t-set">' + esc(t("settings")) + '</button>' + (fs.ok ? '<button id="t-fs">' + esc(fs.label()) + "</button>" : "") + '<a href="./#taverne">' + esc(t("tavern")) + "</a></div>" +
      '<p class="tfoot">' + L(["Ein Spiel zu Imres Tales · Kopfhörer empfohlen", "A game for Imre's Tales · headphones recommended"]) + "</p></div>";
    $("#t-play").onclick = () => { A.init(); if (Z.settings.autoFs !== false && fs.ok && fs.touch && !fs.on()) fs.enter(); preload(); title.hidden = true; Z.player = Z.newPlayer(); Z.loadArea("lager"); if (!Z.meta.intro) { Z.meta.intro = true; Z.saveMeta(); ui.story(); } };
    $("#t-set").onclick = () => { A.init(); ui.settings(); };
    if ($("#t-fs")) $("#t-fs").onclick = () => { A.init(); fs.toggle(); };
    setTimeout(() => $("#t-play").focus(), 50);
  }
  function preload() { A.loadAll(A.allSfxPaths()); }
  ui.story = () => openModal('<h2>' + esc(t("title")) + " · " + L(["Die Feste der Fäden", "The Keep of Threads"]) + '</h2><p class="erz">' + t("intro") + '</p><div class="knoepfe"><button data-act="close" autofocus>' + esc(t("cont")) + "</button></div>", { cls: "schmal" });
  actions.close = () => closeModal();
  ui.tutorial = () => {
    Z.meta.tut = true; Z.saveMeta();
    const dev = (inp.device === "touch" || (ui.touchOn && inp.device !== "pad") ? t("ctrlTouch") : bindingSummary()) + '<br><small class="hinweis">' + L(["Alles umbelegbar: Einstellungen → Steuerung.", "Everything can be remapped: Settings → Controls."]) + "</small>";
    openModal("<h2>" + esc(t("tut")) + '</h2><p class="steuer">' + dev + '</p><p class="tipp">' + esc(L(TX.tips[0])) + '</p><div class="knoepfe"><button data-act="close" autofocus>' + esc(t("cont")) + "</button></div>", { cls: "schmal" });
  };

  /* ---------- Pause ---------- */
  ui.pause = () => {
    if (ui.modalOpen || !Z.level) return;
    const inRun = !!Z.run;
    const tip = L(Z.R.pick(TX.tips));
    openModal("<h2>" + esc(t("pause")) + '</h2><p class="tipp">' + esc(tip) + '</p><div class="knoepfe senk"><button data-act="close" autofocus>' + esc(t("resume")) + '</button><button data-act="ctrl">' + esc(t("tut")) + '</button><button data-act="settings">' + esc(t("settings")) + "</button>" + (fs.ok ? '<button data-act="fullscreen">' + esc(fs.label()) + "</button>" : "") +
      (inRun ? '<button data-act="abort" class="gefahr">' + esc(t("abort")) + "</button>" : "") + '<a class="btn" href="./#taverne">' + esc(t("tavern")) + "</a></div>", { cls: "schmal" });
  };
  actions.ctrl = () => { closeModal(); ui.tutorial(); };
  actions.settings = () => { closeModal(); ui.settings(); };
  actions.abort = () => { closeModal(); ui.confirm(t("abort"), L(["Nicht abgelieferte Seelensplitter gehen verloren.", "Undelivered soul shards will be lost."]), t("abort"), () => { Z.run.time = Z.run.time || 0; ui.deathScreen({ abort: true }); }); };

  /* ---------- Bestätigung ---------- */
  ui.confirm = (head, txt, okLabel, fn) => {
    ui._confirmFn = fn;
    openModal("<h2>" + esc(head) + "</h2><p>" + esc(txt) + '</p><div class="knoepfe"><button data-act="confirmOk" autofocus>' + esc(okLabel) + '</button><button data-act="close">' + esc(t("cancel")) + "</button></div>", { cls: "schmal" });
  };
  actions.confirmOk = () => { const fn = ui._confirmFn; closeModal(); if (fn) fn(); };
  ui.startRunConfirm = () => {
    ui._confirmFn = () => Z.startRun();
    const sk = Z.meta.skullSel || 0;
    openModal("<h2>" + esc(t("startRun")) + "</h2><p>" + esc(t("startRunTxt")) + "</p>" + (sk ? '<p class="schaedel">' + "☠".repeat(sk) + " " + L(["Schädel aktiv", "skulls active"]) + "</p>" : "") + '<div class="knoepfe"><button data-act="confirmOk" autofocus>' + esc(t("go")) + '</button><button data-act="close">' + esc(t("cancel")) + "</button></div>", { cls: "schmal" });
  };

  /* ---------- Einstellungen ---------- */
  ui.settings = () => {
    const s = Z.settings, v = A.vol;
    const sl = (id, lab, val) => '<label class="regler">' + esc(lab) + '<input type="range" min="0" max="100" value="' + Math.round(val * 100) + '" data-vol="' + id + '"></label>';
    const ck = (id, lab, val) => '<label class="schalter"><input type="checkbox" data-set="' + id + '"' + (val ? " checked" : "") + "> " + esc(lab) + "</label>";
    openModal("<h2>" + esc(t("settings")) + '</h2><div class="einst">' +
      sl("master", L(["Gesamtlautstärke", "Master volume"]), v.master) + sl("music", L(["Musik", "Music"]), v.music) + sl("sfx", L(["Effekte", "Effects"]), v.sfx) + sl("amb", L(["Geräuschkulisse", "Ambience"]), v.amb) +
      '<label class="regler">' + L(["Bildschirmwackeln", "Screen shake"]) + '<input type="range" min="0" max="100" value="' + Math.round(s.shake * 100) + '" data-shake="1"></label>' +
      '<label class="regler">' + L(["Größe der Touch-Knöpfe", "Touch button size"]) + '<input type="range" min="70" max="140" value="' + Math.round(s.touchSize * 100) + '" data-touch="1"></label>' +
      ck("showDmg", L(["Schadenszahlen", "Damage numbers"]), s.showDmg) + ck("flashes", L(["Bildschirmblitze", "Screen flashes"]), s.flashes) + ck("vib", L(["Vibration", "Vibration"]), s.vib !== false) +
      '<label class="regler">' + L(["Stick-Totzone (Controller)", "Stick dead zone (controller)"]) + '<input type="range" min="15" max="60" value="' + Math.round((s.dead || 0.35) * 100) + '" data-dead="1"></label>' +
      '<button class="steuerknopf" data-act="controls">' + L(["Steuerung: Tastatur & Controller belegen", "Controls: remap keyboard & controller"]) + "</button>" +
      (fs.ok ? '<button class="steuerknopf" data-act="fullscreen">' + esc(fs.label()) + " <small>· F11 / Alt+Enter</small></button>" + ck("autoFs", L(["Am Handy beim Spielstart automatisch Vollbild", "Automatic fullscreen on phones when starting"]), Z.settings.autoFs !== false) : "") +
      '<button class="steuerknopf" data-act="graphics">' + L(["Grafik, Leistung & Fehlerbericht", "Graphics, performance & error report"]) + " <small>· " + esc(Z.gfxName()) + "</small></button>" +
      ck("autoAim", L(["Zielhilfe für Fernkampf", "Ranged aim assist"]), s.autoAim) + ck("fps", L(["Bilder pro Sekunde anzeigen", "Show FPS"]), s.fps) +
      '<label class="schalter">' + L(["Sprache", "Language"]) + ' <select data-lang="1"><option value="de"' + (s.lang === "de" ? " selected" : "") + '>Deutsch</option><option value="en"' + (s.lang === "en" ? " selected" : "") + ">English</option></select></label>" +
      '</div><div class="knoepfe"><button data-act="close" autofocus>' + esc(t("close")) + "</button></div>", { cls: "schmal", onClose: () => { Z.saveSettings(); A.saveVol(); if (!Z.level) showTitle(); } });
    modal.querySelectorAll("[data-vol]").forEach(r => r.oninput = () => { A.vol[r.dataset.vol] = r.value / 100; A.applyVol(); if (r.dataset.vol === "sfx") A.play("hitFlesh", { vol: 0.6, gap: 0.15 }); });
    modal.querySelector("[data-shake]").oninput = e => { Z.settings.shake = e.target.value / 100; };
    modal.querySelector("[data-dead]").oninput = e => { Z.settings.dead = e.target.value / 100; };
    modal.querySelector("[data-touch]").oninput = e => { Z.settings.touchSize = e.target.value / 100; touchSync(); };
    modal.querySelectorAll("[data-set]").forEach(c => c.onchange = () => { Z.settings[c.dataset.set] = c.checked; if (c.dataset.set === "vib") inp.vib = c.checked; });
    modal.querySelector("[data-lang]").onchange = e => { Z.settings.lang = e.target.value; Z.saveSettings(); closeModal(); for (const k in slotEls) slotEls[k].uid = -9; ui.settings(); };
  };

  /* ---------- Vollbild ---------- */
  const fs = (Z.fs = {
    el: document.documentElement,
    ok: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
    touch: matchMedia("(pointer: coarse)").matches,
    on: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
    label: () => (fs.on() ? L(["Vollbild beenden", "Exit fullscreen"]) : L(["Vollbild", "Fullscreen"])),
    enter() {
      const e = fs.el, req = e.requestFullscreen || e.webkitRequestFullscreen;
      if (!req) return;
      try {
        const p = req.call(e, { navigationUI: "hide" });
        const lock = () => { try { if (fs.touch && screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {}); } catch (_) {} };
        if (p && p.then) p.then(lock).catch(() => ui.toast(L(["Vollbild wurde vom Browser abgelehnt.", "The browser refused fullscreen."]), 2400)); else lock();
      } catch (_) {}
    },
    exit() { const x = document.exitFullscreen || document.webkitExitFullscreen; try { if (x) { const p = x.call(document); if (p && p.catch) p.catch(() => {}); } } catch (_) {} },
    toggle() { fs.on() ? fs.exit() : fs.enter(); }
  });
  const fsBtn = document.getElementById("fsbtn");
  const fsSync = () => {
    if (fsBtn) { fsBtn.hidden = !fs.ok; fsBtn.textContent = fs.on() ? "🗗" : "⛶"; fsBtn.title = fs.label(); fsBtn.setAttribute("aria-label", fs.label()); }
    const tb = document.getElementById("t-fs"); if (tb) tb.textContent = fs.label();
    modal.querySelectorAll('[data-act="fullscreen"]').forEach(b => { const sm = b.querySelector("small"); b.textContent = fs.label() + " "; if (sm) b.appendChild(sm); });
  };
  if (fsBtn) fsBtn.onclick = e => { e.preventDefault(); fs.toggle(); fsBtn.blur(); };
  document.addEventListener("fullscreenchange", fsSync); document.addEventListener("webkitfullscreenchange", fsSync);
  addEventListener("keydown", e => { if (e.code === "Enter" && e.altKey) { e.preventDefault(); e.stopPropagation(); fs.toggle(); } }, true);
  actions.fullscreen = () => fs.toggle();
  fsSync();

  /* ---------- Grafik & Diagnose ---------- */
  ui.graphics = () => {
    const q = Z.gq, g = Z.settings.gfx, D = Z.diag;
    const opt = (v, lab, cur) => '<option value="' + v + '"' + (String(cur) === String(v) ? " selected" : "") + ">" + esc(lab) + "</option>";
    const ck = (id, lab, val) => '<label class="schalter"><input type="checkbox" data-gq="' + id + '"' + (val ? " checked" : "") + "> " + esc(lab) + "</label>";
    const rg = (id, lab, val, mn, mx, unit) => '<label class="regler">' + esc(lab) + ' <b data-out="' + id + '">' + val + unit + '</b><input type="range" min="' + mn + '" max="' + mx + '" step="5" value="' + val + '" data-gr="' + id + '"></label>';
    const nErr = (D.old || []).length + D.errors.length;
    openModal("<h2>" + L(["Grafik & Leistung", "Graphics & performance"]) + '</h2><div class="einst">' +
      '<label class="schalter">' + L(["Qualität", "Quality"]) + ' <select data-preset="1" autofocus>' + opt("auto", L(["Automatisch", "Automatic"]) + (g.preset === "auto" ? " (" + L(Z.GFX_PRESETS[q.level].n) + ")" : ""), g.preset) +
        Z.GFX_PRESETS.map((p, i) => opt(i, L(p.n), g.preset)).join("") + (g.preset === "custom" ? opt("custom", L(["Eigene", "Custom"]), g.preset) : "") + "</select></label>" +
      rg("res", L(["Auflösung", "Resolution"]), Math.round(q.res * 100), 40, 100, " %") +
      rg("part", L(["Partikel & Funken", "Particles & sparks"]), Math.round(q.part * 100), 20, 100, " %") +
      '<label class="schalter">' + L(["Licht und Schatten", "Light and shadow"]) + ' <select data-light="1">' + opt(3, L(["Fein", "Fine"]), q.light) + opt(4, L(["Normal", "Normal"]), q.light) + opt(6, L(["Einfach", "Simple"]), q.light) + opt(8, L(["Grob (schnell)", "Coarse (fast)"]), q.light) + "</select></label>" +
      ck("layers", L(["Hintergrund-Ebenen (Parallax)", "Background layers (parallax)"]), q.layers) + ck("critters", L(["Tiere im Hintergrund", "Background critters"]), q.critters) +
      ck("weather", L(["Wetter (Regen, Asche, Funken …)", "Weather (rain, ash, embers…)"]), q.weather) + ck("fog", L(["Nebel", "Fog"]), q.fog) + ck("vignette", L(["Vignette (dunkle Ränder)", "Vignette (dark edges)"]), q.vignette) +
      '<label class="schalter">' + L(["Bildrate begrenzen", "Limit frame rate"]) + ' <select data-cap="1">' + opt(0, L(["Aus", "Off"]), q.fpsCap) + opt(60, "60 fps", q.fpsCap) + opt(30, L(["30 fps (Akku sparen)", "30 fps (save battery)"]), q.fpsCap) + "</select></label>" +
      '<label class="schalter"><input type="checkbox" data-set="fps"' + (Z.settings.fps ? " checked" : "") + "> " + L(["Bilder pro Sekunde anzeigen", "Show FPS"]) + "</label>" +
      "<h3>" + L(["Fehler & Tests", "Errors & tests"]) + '</h3><p class="hinweis">' + L(["Die Berichte enthalten nur Technik (Gerät, Browser, Bildrate, Fehler) – keine persönlichen Daten. Einfach kopieren und Claude schicken.", "Reports only contain technical data (device, browser, frame rate, errors) – nothing personal. Just copy it and send it to Claude."]) +
        " " + (nErr ? "<b>" + nErr + L([" Fehler gesammelt.", " errors collected."]) + "</b>" : L(["Bisher keine Fehler.", "No errors so far."])) + "</p>" +
      '<button class="steuerknopf" data-act="diagRun">' + L(["Diagnose: 10 Sekunden normal spielen, dann Bericht", "Diagnosis: play normally for 10 seconds, then report"]) + "</button>" +
      '<button class="steuerknopf" data-act="benchRun">' + L(["Grafiktest: alle Stufen durchmessen (ca. 20 s)", "Graphics test: measure every level (approx. 20 s)"]) + "</button>" +
      '<button class="steuerknopf" data-act="diagNow">' + L(["Fehlerbericht jetzt anzeigen", "Show error report now"]) + "</button>" +
      (nErr ? '<button class="steuerknopf" data-act="diagClear">' + L(["Fehlerliste leeren", "Clear error list"]) + "</button>" : "") +
      '</div><div class="knoepfe"><button data-act="graphicsBack">' + esc(t("back")) + "</button></div>", { cls: "schmal", onClose: () => { Z.saveSettings(); if (!Z.level) showTitle(); } });
    const re = () => { const f = document.activeElement && document.activeElement.dataset ? Object.entries(document.activeElement.dataset)[0] : null; ui.onClose = null; closeModal(); ui.graphics(); if (f) setTimeout(() => { const el = modal.querySelector("[data-" + f[0] + '="' + f[1] + '"]'); if (el) el.focus(); }, 40); };
    modal.querySelector("[data-preset]").onchange = e => { Z.setGfx("preset", e.target.value === "auto" || e.target.value === "custom" ? e.target.value : +e.target.value); re(); };
    modal.querySelectorAll("[data-gr]").forEach(r => { r.oninput = () => { modal.querySelector('[data-out="' + r.dataset.gr + '"]').textContent = r.value + " %"; }; r.onchange = () => { Z.setGfx(r.dataset.gr, r.value / 100); re(); }; });
    modal.querySelector("[data-light]").onchange = e => { Z.setGfx("light", +e.target.value); re(); };
    modal.querySelector("[data-cap]").onchange = e => { Z.setGfx("fpsCap", +e.target.value); };
    modal.querySelectorAll("[data-gq]").forEach(c => c.onchange = () => { Z.setGfx(c.dataset.gq, c.checked); re(); });
    modal.querySelector("[data-set=fps]").onchange = e => { Z.settings.fps = e.target.checked; Z.saveSettings(); };
  };
  actions.graphics = () => { Z.saveSettings(); A.saveVol(); ui.onClose = null; closeModal(); ui.graphics(); };
  actions.graphicsBack = () => { ui.onClose = null; closeModal(); ui.settings(); };
  actions.diagRun = () => { Z.saveSettings(); const ok = Z.level; if (!ok) { ui.toast(L(["Die Diagnose misst im laufenden Spiel – erst einen Durchgang starten oder ins Lager gehen.", "The diagnosis measures live gameplay – start a run or enter the camp first."]), 3200); return; } ui.onClose = null; Z.diag.startDiag(10000); };
  actions.benchRun = () => { Z.saveSettings(); if (!Z.level) { ui.toast(L(["Der Grafiktest braucht eine Szene – erst einen Durchgang starten oder ins Lager gehen.", "The graphics test needs a scene – start a run or enter the camp first."]), 3200); return; } ui.onClose = null; Z.diag.startBench(); };
  actions.diagNow = () => { ui.onClose = null; ui.showReport(Z.diag.quick(), L(["Fehlerbericht", "Error report"])); };
  actions.diagClear = () => { Z.diag.clearOld(); ui.onClose = null; closeModal(); ui.graphics(); };
  /* Bericht anzeigen: kopieren, teilen, Empfehlung übernehmen */
  let reportText = "", reportRec = null;
  ui.showReport = (text, head, rec) => {
    reportText = text; reportRec = rec;
    openModal("<h2>" + esc(head) + '</h2><p class="hinweis">' + L(["Kopieren und einfach im Chat einfügen.", "Copy it and paste it into the chat."]) + '</p><textarea class="bericht" readonly rows="14">' + esc(text) + "</textarea>" +
      '<div class="knoepfe">' + '<button data-act="repCopy" autofocus>' + L(["Kopieren", "Copy"]) + "</button>" + (navigator.share ? '<button data-act="repShare">' + L(["Teilen …", "Share…"]) + "</button>" : "") +
      (rec != null ? '<button data-act="repApply">' + L(["Empfehlung übernehmen: ", "Apply recommendation: "]) + esc(L(Z.GFX_PRESETS[rec].n)) + "</button>" : "") +
      '<button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
  };
  actions.repCopy = () => {
    const done = () => ui.toast(L(["Bericht kopiert – jetzt im Chat einfügen.", "Report copied – now paste it into the chat."]), 2600);
    const fallback = () => { const ta = modal.querySelector(".bericht"); if (ta) { ta.removeAttribute("readonly"); ta.select(); try { document.execCommand("copy"); done(); } catch (_) { ui.toast(L(["Bitte den Text markieren und kopieren.", "Please select the text and copy it."]), 3000); } ta.setAttribute("readonly", ""); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(reportText).then(done, fallback); else fallback(); } catch (_) { fallback(); }
  };
  actions.repShare = () => { try { navigator.share({ title: "Ezekiel – The Destroyer · Bericht", text: reportText }).catch(() => {}); } catch (_) {} };
  actions.repApply = () => { if (reportRec != null) { Z.setGfx("preset", reportRec); ui.toast(L(["Grafik: ", "Graphics: "]) + "<b>" + esc(Z.gfxName()) + "</b>", 2200); } closeModal(); };
  /* bei einem Fehler einmal pro Sitzung leise Bescheid geben */
  let errHinted = false;
  Z.diag.onError = () => { if (errHinted) return; errHinted = true; setTimeout(() => ui.toast(L(["Es ist ein Fehler aufgetreten. Bericht: Einstellungen → Grafik, Leistung & Fehlerbericht.", "An error occurred. Report: Settings → Graphics, performance & error report."]), 4200), 200); };

  /* ---------- Steuerung belegen ---------- */
  const ACT_NAMES = { left: ["Links", "Left"], right: ["Rechts", "Right"], up: ["Hoch / Leiter", "Up / ladder"], down: ["Runter / Ducken", "Down / crouch"], jump: ["Springen", "Jump"], roll: ["Rolle", "Roll"],
    a1: ["Waffe 1", "Weapon 1"], a2: ["Waffe 2", "Weapon 2"], s1: ["Fähigkeit 1", "Skill 1"], s2: ["Fähigkeit 2", "Skill 2"], use: ["Benutzen / Aufheben", "Use / pick up"], potion: ["Heiltrank", "Healing potion"], map: ["Karte", "Map"], pause: ["Pause", "Pause"] };
  function bindingSummary() {
    const pad = inp.device === "pad";
    const row = a => "<b>" + esc(pad ? inp.label(a) : inp.keyName(inp.keys[a][0] || inp.keys[a][1])) + "</b> " + esc(L(ACT_NAMES[a]));
    return (pad ? L(["Linker Stick / Steuerkreuz laufen · ", "Left stick / D-pad move · "]) : "<b>" + esc(inp.keyName(inp.keys.left[0])) + "/" + esc(inp.keyName(inp.keys.right[0])) + "</b> " + L(["laufen · ", "move · "])) +
      ["jump", "roll", "a1", "a2", "s1", "s2", "potion", "use", "map", "pause"].map(row).join(" · ") + (pad ? "" : L([" · Linksklick/Rechtsklick: Waffe 1/2 · Runter + Sprung: durch Stege fallen · Runter + Angriff in der Luft: Sturzangriff", " · Left/right click: weapon 1/2 · Down + jump: drop through ledges · Down + attack in the air: plunge"]));
  }
  ui.controls = () => {
    const padOn = !!inp.lastPad;
    const cell = (a, kind, slot) => { const lab = kind === "pad" ? inp.padButtonName(inp.pad[a]) : inp.keyName(inp.keys[a][slot]); return '<button class="belegung" data-act="bind" data-arg="' + a + "|" + kind + "|" + slot + '">' + esc(lab) + "</button>"; };
    let rows = "";
    for (const a in ACT_NAMES) rows += "<tr><th>" + esc(L(ACT_NAMES[a])) + "</th><td>" + cell(a, "key", 0) + "</td><td>" + cell(a, "key", 1) + "</td><td>" + (inp.pad[a] != null ? cell(a, "pad", 0) : '<span class="fix">' + (a === "left" || a === "right" || a === "up" || a === "down" ? L(["Stick + Kreuz", "Stick + D-pad"]) : "–") + "</span>") + "</td></tr>";
    openModal("<h2>" + L(["Steuerung", "Controls"]) + "</h2>" +
      '<p class="hinweis">' + (padOn ? "🎮 " + esc(inp.padName.replace(/\(.*?\)/g, "").trim() || L(["Controller verbunden", "Controller connected"])) : L(["Kein Controller erkannt – einmal einen Knopf drücken, dann erscheint er hier.", "No controller detected – press any button and it will appear here."])) + "</p>" +
      '<table class="belegtab"><thead><tr><th></th><th>' + L(["Taste", "Key"]) + "</th><th>" + L(["Zweite Taste", "Second key"]) + "</th><th>Controller</th></tr></thead><tbody>" + rows + "</tbody></table>" +
      '<p class="hinweis" id="bindhint">' + L(["Feld wählen, dann die neue Taste oder den Controller-Knopf drücken. Esc bricht ab. Maus: links Waffe 1, rechts Waffe 2.", "Pick a field, then press the new key or controller button. Esc cancels. Mouse: left weapon 1, right weapon 2."]) + "</p>" +
      '<div class="knoepfe"><button data-act="bindReset">' + L(["Standard wiederherstellen", "Restore defaults"]) + '</button><button data-act="controlsBack" autofocus>' + esc(t("back")) + "</button></div>", { cls: "breit" });
  };
  actions.controls = () => { Z.saveSettings(); closeModal(); ui.controls(); };
  actions.controlsBack = () => { closeModal(); ui.settings(); };
  actions.bindReset = () => { inp.reset(); for (const k in slotEls) slotEls[k].lab = null; ui.controls(); };
  actions.bind = (arg, btn) => {
    const [a, kind, slot] = arg.split("|");
    btn.textContent = kind === "pad" ? L(["Knopf drücken …", "Press button…"]) : L(["Taste drücken …", "Press key…"]);
    btn.classList.add("wartet");
    const done = () => { for (const k in slotEls) slotEls[k].lab = null; A.play("uiOk", { vol: 0.4 }); const f = arg; ui.controls(); setTimeout(() => { const b = modal.querySelector('[data-arg="' + f + '"]'); if (b) b.focus(); }, 40); };
    inp.capture = { kind, action: a, slot: +slot, done };
  };

  /* ---------- Gegenstand aufheben / tauschen ---------- */
  ui.offerItem = p => {
    const P = Z.player, it = p.it, isSkill = it.type === "skill";
    const sA = isSkill ? "s1" : "a1", sB = isSkill ? "s2" : "a2";
    if (!Z.meta.found[it.id]) setTimeout(() => ui.toast("<b>" + L(["Neu im Fundbuch: ", "New in the ledger: "]) + esc(L(Z.itemDef(it).n)) + "</b><br><small>" + L(["Nundro kann sie ab jetzt im Lager schärfen.", "Nundro can now sharpen it in camp."]) + "</small>", 3200), 300);
    Z.meta.found[it.id] = true; Z.saveMeta();
    const place = s => {
      const old = P.slots[s]; P.slots[s] = it;
      Z.pickups.splice(Z.pickups.indexOf(p), 1);
      if (old) Z.spawnPickup("item", p.x, p.y - 4, { it: old, drop: true, vy: -140, vx: -P.face * 60 });
      if (P.mag[s]) delete P.mag[s];
      P.combo[s] = 0;
      A.play("pickup", { vol: 0.6 }); Z.fx.text(P.x + P.w / 2, P.y - 12, L(Z.itemDef(it).n), Z.RARITY[it.rar].col, true);
      Z.fx.burst(P.x + P.w / 2, P.y + 10, 14, { col: [Z.RARITY[it.rar].col, "#fff"], sp: 80, up: 40, life: 0.5, size: 2, kind: "spark", add: true });
    };
    if (!P.slots[sA]) return place(sA);
    if (!P.slots[sB]) return place(sB);
    /* beide belegt: Auswahl */
    ui.choiceActive = { p, sA, sB, place };
    const key = s => inp.device === "touch" || (ui.touchOn && inp.device !== "pad") ? "" : inp.label(s);
    choice.innerHTML = '<div class="ch-kopf">' + esc(t("replace")) + ": " + '<b style="color:' + Z.RARITY[it.rar].col + '">' + esc(L(Z.itemDef(it).n)) + "</b></div>" +
      [sA, sB].map(s => '<button data-slot="' + s + '"><kbd>' + key(s) + "</kbd> " + esc(L(Z.itemDef(P.slots[s]).n)) + '<small style="color:' + Z.RARITY[P.slots[s].rar].col + '">' + esc(L(Z.RARITY[P.slots[s].rar].n)) + "</small></button>").join("") +
      '<button data-slot="x" class="abbr">' + (key("roll") ? "<kbd>" + key("roll") + "</kbd> " : "") + esc(t("cancel")) + "</button>";
    choice.hidden = false;
  };
  choice.addEventListener("click", e => { const b = e.target.closest("[data-slot]"); if (!b || !ui.choiceActive) return; const c = ui.choiceActive; ui.choiceActive = null; choice.hidden = true; if (b.dataset.slot !== "x") c.place(b.dataset.slot); });
  function choiceInput() {
    const c = ui.choiceActive; if (!c) return;
    for (const s of [c.sA, c.sB]) if (inp.pressed[s]) { inp.consume(s); ui.choiceActive = null; choice.hidden = true; c.place(s); Z.player.buf[s] = 0; return; }
    if (inp.pressed.roll || inp.pressed.pause) { ui.choiceActive = null; choice.hidden = true; inp.consume("pause"); inp.consume("roll"); Z.player.buf.roll = 0; }
    const P = Z.player; if (P && Math.abs(c.p.x - (P.x + P.w / 2)) > 50) { ui.choiceActive = null; choice.hidden = true; }
  }

  /* ---------- Schriftrolle ---------- */
  ui.scrollChoice = () => {
    const P = Z.player;
    openModal("<h2>" + esc(t("scrollT")) + "</h2><p>" + esc(t("scrollD")) + '</p><div class="rollen">' +
      ["brut", "takt", "ueber"].map((s, i) => '<button data-act="stat" data-arg="' + s + '" style="--c:' + Z.STATS[s].col + '"' + (i === 0 ? " autofocus" : "") + "><b>" + esc(L(Z.STATS[s].n)) + " " + P.stats[s] + " → " + (P.stats[s] + 1) + "</b><small>" + esc(L(Z.STATS[s].d)) + "</small></button>").join("") +
      "</div>", { cls: "schmal", noEsc: true });
  };
  actions.stat = s => { const P = Z.player; P.stats[s]++; const before = P.hpMax; Z.recalcPlayer(); P.hp += P.hpMax - before; closeModal(); A.play("holy", { vol: 0.5 }); Z.fx.text(P.x + P.w / 2, P.y - 14, L(Z.STATS[s].n) + " +1", Z.STATS[s].col, true); Z.fx.burst(P.x + P.w / 2, P.y + 10, 20, { col: Z.STATS[s].col, sp: 60, up: 60, life: 0.8, size: 2.5, kind: "glow", add: true }); };

  /* ---------- Lager: Figuren ---------- */
  /* Sprechblase über einer Figur im Lager */
  const bubble = $("#bubble"); let bubbleT = 0, bubbleAt = null;
  ui.say = (wx, wy, who, txt, ms) => { bubble.innerHTML = (who ? "<b>" + esc(who) + "</b>" : "") + esc(txt); bubble.hidden = false; bubbleAt = [wx, wy]; bubbleT = (ms || 4200) / 1000; };
  function bubbleTick(dt) { if (bubble.hidden) return; bubbleT -= dt; if (bubbleT <= 0 || ui.modalOpen) { bubble.hidden = true; return; } const [x, y] = worldToScreen(bubbleAt[0], bubbleAt[1]); bubble.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px) translate(-50%,-100%)"; }
  ui.npc = id => {
    const lines = Z.CAMP_TALK[id];
    const s = Z.level.props.find(p => p.id === id);
    if (lines && s) ui.say(s.x * Z.TILE + 8, s.y * Z.TILE - 22, { B: "Barradin", G: "Friedrich", E: "Echo", A: "Nundro", R: "Rex", C: "" }[id] || "", L(Z.R.pick(lines)), id === "A" || id === "B" || id === "C" ? 2600 : 4600);
    if (id === "A") setTimeout(() => ui.forge(), 900);
    if (id === "B") setTimeout(() => ui.codex(), 900);
    if (id === "C") setTimeout(() => ui.skulls(), 700);
    if (id === "F") ui.story();
    if (id === "Y") ui.say(s.x * Z.TILE + 8, s.y * Z.TILE - 26, "", L(["Die Puppe hält alles aus. Probier deine Kombos – über ihr erscheint der Schaden pro Sekunde.", "The dummy takes everything. Try your combos – damage per second appears above it."]), 4200);
    if (id === "R") A.play("bark");
  };

  /* ---------- Schmiede ---------- */
  const FIND_COST = { haeufig: 1, selten: 1.3, rar: 1.7, legende: 2.4 };
  const lvlCost = (d, l) => Math.round((18 + 26 * l) * FIND_COST[d.find || "haeufig"]);
  const luckCost = l => [30, 70, 140][l];
  const upCost = (k, l) => ({ trank: [60, 150][l], zaeh: 25 * (l + 1), klingen: 40 * (l + 1), haendler: 50 * (l + 1) }[k]);
  const upMax = { trank: 2, zaeh: 5, klingen: 5, haendler: 3 };
  let forgeTab = 0;
  ui.forge = (tab) => {
    if (tab != null) forgeTab = +tab;
    const M = Z.meta, tabs = L(TX.tabsForge);
    let body = '<div class="reiter">' + tabs.map((x, i) => '<button data-act="forgeTab" data-arg="' + i + '" class="' + (i === forgeTab ? "an" : "") + '">' + esc(x) + "</button>").join("") + "</div>";
    if (forgeTab < 2) {
      const pool = forgeTab === 0 ? Z.WEAPONS : Z.SKILLS;
      body += '<div class="liste">';
      for (const id in pool) {
        const d = pool[id]; if (!d.find) continue;
        const found = M.found[id], lvl = M.wlvl[id] || 0, luck = M.luck[id] || 0;
        if (!found) { body += '<div class="zeile unbekannt"><span class="ico" data-icon="' + d.icon + '" data-col="#3a3236"></span><div><b>???</b><small>' + esc(L(Z.FIND[d.find].n)) + " · " + (d.only ? L(["nur an bestimmten Orten", "only in certain places"]) : L(["ab Gebietsstufe", "from area tier"]) + " " + ((d.tier || 0) + 1)) + "</small></div></div>"; continue; }
        const c1 = lvl < 5 ? lvlCost(d, lvl) : 0, c2 = luck < 3 ? luckCost(luck) : 0;
        body += '<div class="zeile"><span class="ico" data-icon="' + d.icon + '" data-col="' + d.col + '"></span><div><b>' + esc(L(d.n)) + (lvl ? ' <span class="lv">+' + lvl + "</span>" : "") + '</b><small>' + esc(L(d.d)) + "</small>" + (d.master ? '<small class="' + (lvl >= 3 ? "meister" : "gesperrt") + '">' + esc(L(d.master)) + (lvl >= 3 ? "" : L([" (ab Stufe 3)", " (from level 3)"])) + "</small>" : "") + "</div>" +
          '<div class="kauf"><button data-act="wlvl" data-arg="' + id + '"' + (lvl >= 5 || M.shards < c1 ? " disabled" : "") + ">" + (lvl >= 5 ? esc(t("max")) : esc(t("upgrade")) + " " + (lvl + 1) + " · " + c1 + "◆") + '</button><button data-act="luck" data-arg="' + id + '"' + (luck >= 3 || M.shards < c2 ? " disabled" : "") + ">" + esc(t("luck")) + " " + "★".repeat(luck) + "☆".repeat(3 - luck) + (luck < 3 ? " · " + c2 + "◆" : "") + "</button></div></div>";
      }
      body += "</div>";
    } else {
      body += '<div class="liste">';
      for (const k in TX.ups) {
        const l = M.up[k] || 0, mx = upMax[k], c = l < mx ? upCost(k, l) : 0;
        body += '<div class="zeile"><div><b>' + esc(L(TX.ups[k][0])) + " " + "●".repeat(l) + "○".repeat(mx - l) + "</b><small>" + esc(L(TX.ups[k][1])) + '</small></div><div class="kauf"><button data-act="up" data-arg="' + k + '"' + (l >= mx || M.shards < c ? " disabled" : "") + ">" + (l >= mx ? esc(t("max")) : c + "◆") + "</button></div></div>";
      }
      body += "</div>";
    }
    openModal("<h2>" + esc(t("forge")) + ' <span class="bank">' + U.fmt(M.shards) + " ◆ " + esc(t("shards")) + "</span></h2>" + '<p class="hinweis">' + L(["Jede Waffe, die du einmal getragen hast, kann hier geschärft werden. Fundglück macht sie in der Feste häufiger. Finden musst du sie trotzdem.", "Any weapon you have carried once can be sharpened here. Find luck makes it more common in the keep. You still have to find it."]) + "</p>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
    drawIcons();
  };
  function drawIcons() { modal.querySelectorAll(".ico[data-icon]").forEach(el => { const cv = document.createElement("canvas"); cv.width = 64; cv.height = 64; const c = cv.getContext("2d"); c.scale(2, 2); Z.drawIcon(c, el.dataset.icon, 16, 17, 22, el.dataset.col); el.appendChild(cv); }); }
  actions.forgeTab = i => ui.forge(i);
  actions.wlvl = id => { const M = Z.meta, d = Z.WEAPONS[id] || Z.SKILLS[id], l = M.wlvl[id] || 0, c = lvlCost(d, l); if (M.shards < c || l >= 5) return; M.shards -= c; M.wlvl[id] = l + 1; Z.saveMeta(); A.play("anvil", { vol: 0.7 }); ui.forge(); };
  actions.luck = id => { const M = Z.meta, l = M.luck[id] || 0, c = luckCost(l); if (M.shards < c || l >= 3) return; M.shards -= c; M.luck[id] = l + 1; Z.saveMeta(); A.play("gem", { vol: 0.6 }); ui.forge(); };
  actions.up = k => { const M = Z.meta, l = M.up[k] || 0, c = upCost(k, l); if (M.shards < c || l >= upMax[k]) return; M.shards -= c; M.up[k] = l + 1; Z.saveMeta(); A.play("anvil", { vol: 0.7 }); if (k === "trank") { Z.player.potMax = Z.player.potions = 2 + M.up.trank; } if (k === "zaeh") { Z.recalcPlayer(); Z.player.hp = Z.player.hpMax; } ui.forge(); };

  /* ---------- Fundbuch ---------- */
  let codexTab = 0;
  function findChance(id, d, tier) {
    const pool = Z.WEAPONS[id] ? Z.WEAPONS : Z.SKILLS; let sum = 0, mine = 0;
    for (const k in pool) { const x = pool[k]; if (!x.find || (x.tier || 0) > tier + 1 || x.legendaryOnly) continue; const w = Z.FIND[x.find].w * (1 + 0.7 * (Z.meta.luck[k] || 0)) * (x.only ? 0.35 : 1); sum += w; if (k === id) mine = w; }
    return sum ? mine / sum * 100 : 0;
  }
  ui.codex = (tab) => {
    if (tab != null) codexTab = +tab;
    const M = Z.meta, tabs = L(TX.tabsCodex);
    let body = '<div class="reiter">' + tabs.map((x, i) => '<button data-act="codexTab" data-arg="' + i + '" class="' + (i === codexTab ? "an" : "") + '">' + esc(x) + "</button>").join("") + "</div><div class=\"liste\">";
    if (codexTab <= 1) {
      const pool = codexTab === 0 ? Z.WEAPONS : Z.SKILLS;
      for (const id in pool) {
        const d = pool[id]; if (!d.find) continue;
        const found = M.found[id];
        const ch = d.legendaryOnly ? L(["nur vom Wraith", "only from the Wraith"]) : findChance(id, d, 3).toFixed(1) + " %";
        body += '<div class="zeile' + (found ? "" : " unbekannt") + '"><span class="ico" data-icon="' + d.icon + '" data-col="' + (found ? d.col : "#3a3236") + '"></span><div><b>' + (found ? esc(L(d.n)) : "???") + "</b><small>" + (found ? esc(L(d.d)) : esc(t("unknown"))) + '</small><small class="fund">' + esc(L(Z.FIND[d.find].n)) + " · " + esc(t("findChance")) + " ≈ " + ch + (d.only ? " · " + L(["Orte: ", "Places: "]) + d.only.map(o => Z.BOSSDEF[o] && !Z.BIOMES[o] && !Z.ARENAS[o] ? L(Z.BOSSDEF[o].n) : Z.areaName(o)).join(", ") : "") + (d.tags ? " · " + d.tags.join(", ") : "") + "</small></div></div>";
      }
    } else if (codexTab === 2) {
      for (const id in Z.ENEMIES) { if (id === "puppe" || id === "glutlingKlein") continue; const d = Z.ENEMIES[id], n = M.seen[id] || 0; body += '<div class="zeile' + (n ? "" : " unbekannt") + '"><div><b>' + (n ? esc(L(d.n)) : "???") + "</b><small>" + (n ? L(["Erschlagen: ", "Slain: "]) + n + " · " + d.atks.length + L([" Angriffe", " attacks"]) + (d.undead ? L([" · untot", " · undead"]) : "") + (d.demon ? L([" · Dämon", " · demon"]) : "") + (d.front ? L([" · Schild vorn – von hinten angreifen", " · shield in front – attack from behind"]) : "") : "") + "</small></div></div>"; }
    } else if (codexTab === 3) {
      for (const id in Z.BOSSDEF) { if (id === "nezna") continue; const d = Z.BOSSDEF[id], b = M.bosses[id]; body += '<div class="zeile' + (b ? "" : " unbekannt") + '"><div><b>' + (b ? esc(L(d.n)) : "???") + "</b><small>" + (b ? esc(L(d.title || ["", ""])) + " · " + L(["Begegnet ", "Met "]) + b.seen + "× · " + L(["Besiegt ", "Defeated "]) + b.won + "×" : "") + "</small></div></div>"; }
    } else if (codexTab === 4) {
      for (const k of ["tiefe", "glut", "himmel", "alle"]) { const got = M.endings[k]; body += '<div class="zeile' + (got ? "" : " unbekannt") + '"><div><b>' + (got ? esc(L(TX.endings[k][0])) : "???") + "</b><small>" + (got ? L(TX.endings[k][1]).slice(0, 160).replace(/<br>/g, " ") + " …" : k === "alle" ? L(["Erreiche alle drei Enden.", "Reach all three endings."]) : L(["Ein Ende der Feste. Welcher Weg führt dorthin?", "An ending of the keep. Which path leads there?"])) + "</small></div></div>"; }
    } else {
      body += '<div class="zeile"><div><b>' + L(["Läufe", "Runs"]) + ": " + M.runs + " · " + L(["Siege", "Wins"]) + ": " + M.wins + "</b><small>" + L(["Meiste Kills in einem Lauf", "Most kills in one run"]) + ": " + M.best.kills + (M.best.time ? " · " + L(["Schnellster Sieg", "Fastest win"]) + ": " + fmtTime(M.best.time) : "") + "</small></div></div>";
    }
    body += "</div>";
    openModal("<h2>" + esc(t("codex")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
    drawIcons();
  };
  actions.codexTab = i => ui.codex(i);

  /* ---------- Schädelaltar ---------- */
  ui.skulls = () => {
    const M = Z.meta, mx = Math.min(5, M.skulls || 0);
    let body = "<p>" + esc(t("skullDesc")) + '</p><div class="schaedelwahl">';
    for (let i = 0; i <= 5; i++) body += '<button data-act="skull" data-arg="' + i + '"' + (i > mx ? " disabled" : "") + ' class="' + (i === (M.skullSel || 0) ? "an" : "") + '">' + (i ? "☠".repeat(i) : "–") + "</button>";
    body += "</div>" + (mx === 0 ? '<p class="hinweis">' + L(["Besiege einen Endboss, um den ersten Schädel zu verdienen.", "Defeat a final boss to earn your first skull."]) + "</p>" : "");
    openModal("<h2>" + esc(t("skullT")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close" autofocus>' + esc(t("close")) + "</button></div>", { cls: "schmal" });
  };
  actions.skull = i => { Z.meta.skullSel = +i; Z.saveMeta(); A.play("bell", { vol: 0.4 }); ui.skulls(); };

  /* ---------- Durchgang: Brunnen, Händler, Altar ---------- */
  ui.station = id => {
    const P = Z.player, lv = Z.level;
    if (id === "K") {
      if (lv.fountainUsed) return ui.toast(L(["Der Brunnen ist leer.", "The fountain is dry."]));
      lv.fountainUsed = true; P.potions = P.potMax; Z.healPlayer(P.hpMax * 0.25); A.play("splash", { vol: 0.6 }); A.play("heal");
      return ui.toast(L(["Heiltränke aufgefüllt.", "Healing potions refilled."]));
    }
    if (id === "M") return ui.shop();
    if (id === "S") return ui.altar();
  };
  ui.shop = () => {
    const P = Z.player, lv = Z.level;
    let body = '<p class="hinweis">„' + L(["Kaufen oder raus.", "Buy or get out."]) + '“</p><div class="liste">';
    (lv.shop || []).forEach((it, i) => {
      const price = Z.itemPrice(it);
      body += '<div class="zeile ware"><span class="ico" data-icon="' + Z.itemDef(it).icon + '" data-col="' + Z.itemDef(it).col + '"></span><div class="ic">' + itemCardHTML(it, true) + '</div><div class="kauf"><button data-act="buy" data-arg="' + i + '"' + (it.sold || P.gold < price ? " disabled" : "") + ">" + (it.sold ? esc(t("sold")) : U.fmt(price) + " ●") + "</button></div></div>";
    });
    const healPrice = Math.round(40 + 30 * Z.run.tier);
    body += '<div class="zeile"><div><b>' + L(["Pilzbraten (60 % Leben)", "Mushroom roast (60% health)"]) + '</b><small>„' + L(["Frisch aus Gracklstugh.", "Fresh from Gracklstugh."]) + '“</small></div><div class="kauf"><button data-act="buyHeal"' + (P.gold < healPrice || P.hp >= P.hpMax ? " disabled" : "") + ">" + healPrice + " ●</button></div></div>";
    if (P.curse > 0) body += '<div class="zeile"><div><b>' + L(["Fluch brechen", "Break the curse"]) + '</b></div><div class="kauf"><button data-act="buyCurse"' + (P.gold < Math.max(150, P.curse * 15) ? " disabled" : "") + ">" + Math.max(150, P.curse * 15) + " ●</button></div></div>";
    body += "</div>";
    openModal("<h2>" + esc(t("shop")) + ' <span class="bank">' + U.fmt(P.gold) + " ● " + esc(t("gold")) + "</span></h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
    drawIcons();
  };
  actions.buy = i => {
    const P = Z.player, it = Z.level.shop[+i], price = Z.itemPrice(it);
    if (it.sold || P.gold < price) return ui.toast(t("noGold"));
    P.gold -= price; it.sold = true; A.play("coin", { vol: 0.6 });
    closeModal();
    const p = Z.spawnPickup("item", P.x + P.w / 2 + P.face * 14, P.y + P.h, { it: Object.assign({}, it, { uid: it.uid + 100000 }), vx: 0, vy: -100 });
    ui.toast(L(["Gekauft. Es liegt vor dir.", "Bought. It lies before you."]));
  };
  actions.buyHeal = () => { const P = Z.player, price = Math.round(40 + 30 * Z.run.tier); if (P.gold < price) return; P.gold -= price; Z.healPlayer(P.hpMax * 0.6); A.play("heal"); ui.shop(); };
  actions.buyCurse = () => { const P = Z.player, cost = Math.max(150, P.curse * 15); if (P.gold < cost) return; P.gold -= cost; P.curse = 0; A.play("holy"); ui.shop(); };
  ui.altar = () => {
    const P = Z.player, lv = Z.level;
    if (lv.blessTaken) return ui.toast(L(["Der Altar ist erloschen.", "The altar has gone dark."]));
    const full = P.bless.length >= 3;
    let body = "<p>" + L(["Wähle einen Segen. Er begleitet dich bis zum Ende des Laufs. Höchstens drei.", "Choose a blessing. It stays with you until the end of the run. Three at most."]) + '</p><div class="rollen">';
    lv.blessOffer.forEach((b, i) => { const d = Z.BLESS[b]; body += '<button data-act="bless" data-arg="' + b + '"' + (i === 0 ? " autofocus" : "") + ' class="k-' + d.k + '"><b>' + esc(L(d.n)) + '</b><small class="art">' + esc(L(Z.BLESS_KIND[d.k])) + "</small><small>" + esc(L(d.d)) + "</small></button>"; });
    body += "</div>" + (full ? '<p class="hinweis">' + L(["Du trägst schon drei Segen. Wählst du einen neuen, entscheidest du danach, welcher geht.", "You already carry three blessings. If you choose a new one, you'll then decide which one leaves."]) + "</p>" : "");
    openModal("<h2>" + esc(t("altar")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "schmal" });
  };
  actions.bless = b => {
    const P = Z.player, lv = Z.level;
    if (P.bless.length >= 3) {
      closeModal();
      let body = "<p>" + L(["Welcher Segen soll gehen?", "Which blessing should leave?"]) + '</p><div class="rollen">' + P.bless.map((x, i) => '<button data-act="blessSwap" data-arg="' + x + "|" + b + '"' + (i === 0 ? " autofocus" : "") + "><b>" + esc(L(Z.BLESS[x].n)) + "</b><small>" + esc(L(Z.BLESS[x].d)) + "</small></button>").join("") + "</div>";
      return openModal("<h2>" + esc(t("altar")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("cancel")) + "</button></div>", { cls: "schmal" });
    }
    P.bless.push(b); lv.blessTaken = true; afterBless(b);
  };
  actions.blessSwap = arg => { const [oldB, newB] = arg.split("|"); const P = Z.player; P.bless = P.bless.filter(x => x !== oldB); P.bless.push(newB); Z.level.blessTaken = true; afterBless(newB); };
  function afterBless(b) { closeModal(); const P = Z.player; Z.recalcPlayer(); A.play("holy", { vol: 0.6 }); Z.fx.flashScreen("#ff8a5a", 0.3); Z.fx.text(P.x + P.w / 2, P.y - 14, L(Z.BLESS[b].n), "#ffb090", true); }

  /* ---------- Tod & Ende ---------- */
  function statsHTML() {
    if (Z.runStatsHTML) return Z.runStatsHTML();
    const P = Z.player, run = Z.run || { time: 0, shardsBank: 0 };
    return '<div class="stats"><div><b>' + (Z.stats.kills || 0) + "</b>" + esc(t("kills")) + "</div><div><b>" + fmtTime(run.time) + "</b>" + esc(t("time")) + "</div><div><b>" + U.fmt(Z.stats.gold || 0) + "</b>" + esc(t("gold")) + "</div><div><b>" + (Z.stats.parries || 0) + "</b>" + esc(t("parries")) + "</div><div><b>" + run.shardsBank + "</b>" + esc(t("shardsKept")) + "</div>" + (P && P.shards ? "<div><b>" + P.shards + "</b>" + esc(t("shardsLost")) + "</div>" : "") + "</div>" +
      '<p class="hinweis">' + esc(t("reached")) + ": " + (run.route || []).map(r => esc(Z.areaName(r))).join(" → ") + "</p>";
  }
  ui.deathScreen = o => {
    openModal("<h2>" + esc(t("died")) + "</h2><p><i>" + esc(o && o.abort ? L(["Ezekiel kehrt um. Ohne ein Wort.", "Ezekiel turns back. Without a word."]) : t("diedSub")) + "</i></p>" + statsHTML() + '<p class="tipp">' + esc(L(Z.R.pick(TX.tips))) + '</p><div class="knoepfe"><button data-act="toCamp" autofocus>' + esc(t("camp")) + "</button></div>", { cls: "breit", noEsc: true });
  };
  actions.toCamp = () => { closeModal(); Z.backToCamp(); };
  ui.ending = key => {
    const M = Z.meta, run = Z.run;
    const first = !M.endings[key];
    M.endings[key] = (M.endings[key] || 0) + 1; M.wins++;
    if (!M.best.time || run.time < M.best.time) M.best.time = run.time;
    const newSkull = run.skulls >= (M.skulls || 0) && (M.skulls || 0) < 5;
    if (newSkull) M.skulls = (M.skulls || 0) + 1;
    /* Splitter aus dem letzten Abschnitt sichern */
    M.shards += Z.player.shards; run.shardsBank += Z.player.shards; Z.player.shards = 0;
    const all = M.endings.tiefe && M.endings.glut && M.endings.himmel;
    const showAll = all && !M.endings.alle;
    if (showAll) M.endings.alle = 1;
    Z.saveMeta();
    const e = TX.endings[key];
    openModal('<h2 class="ende">' + esc(L(e[0])) + '</h2><p class="erz">' + L(e[1]) + "</p>" + (showAll ? '<h2 class="ende">' + esc(L(TX.endings.alle[0])) + '</h2><p class="erz">' + L(TX.endings.alle[1]) + "</p>" : "") + statsHTML() + (newSkull ? '<p class="schaedel">☠ ' + esc(t("winSkull")) + "</p>" : "") + '<div class="knoepfe"><button data-act="toCamp" autofocus>' + esc(t("camp")) + "</button></div>", { cls: "breit", noEsc: true });
    A.play("holy", { vol: 0.6 });
  };

  /* ======================= TOUCH ======================= */
  const tc = $("#touch");
  ui.touchOn = false;
  function touchSync() { tc.hidden = !ui.touchOn || !Z.level; tc.style.setProperty("--ts", Z.settings.touchSize); }
  addEventListener("touchstart", () => { if (!ui.touchOn) { ui.touchOn = true; inp.device = "touch"; touchSync(); } }, { passive: true });
  /* Stick */
  const stick = $("#stick"), knob = $("#knob");
  let stickId = null, sx0 = 0, sy0 = 0;
  const stickArea = $("#stickzone");
  stickArea.addEventListener("pointerdown", e => { stickId = e.pointerId; sx0 = e.clientX; sy0 = e.clientY; stick.style.left = sx0 + "px"; stick.style.top = sy0 + "px"; stick.classList.add("an"); stickArea.setPointerCapture(e.pointerId); moveStick(e); });
  stickArea.addEventListener("pointermove", e => { if (e.pointerId === stickId) moveStick(e); });
  const endStick = e => { if (e.pointerId !== stickId) return; stickId = null; stick.classList.remove("an"); knob.style.transform = ""; ["left", "right", "up", "down"].forEach(a => inp.setTouch(a, false)); };
  stickArea.addEventListener("pointerup", endStick); stickArea.addEventListener("pointercancel", endStick);
  function moveStick(e) {
    const dx = e.clientX - sx0, dy = e.clientY - sy0, r = 46 * Z.settings.touchSize, d = Math.hypot(dx, dy), k = d > r ? r / d : 1;
    knob.style.transform = "translate(" + dx * k + "px," + dy * k + "px)";
    const th = 14;
    inp.setTouch("left", dx < -th); inp.setTouch("right", dx > th);
    inp.setTouch("up", dy < -th * 2.2 && Math.abs(dy) > Math.abs(dx) * 0.7); inp.setTouch("down", dy > th * 2.2 && Math.abs(dy) > Math.abs(dx) * 0.7);
  }
  tc.querySelectorAll("[data-t]").forEach(b => {
    const a = b.dataset.t;
    b.addEventListener("pointerdown", e => { e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add("an"); if (a === "pause") return ui.pause(); if (a === "map") { bigMap = !bigMap; drawMinimap(); return; } inp.setTouch(a, true); A.init(); });
    const up = () => { b.classList.remove("an"); if (a !== "pause" && a !== "map") inp.setTouch(a, false); };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
  });

  /* ======================= JEDES BILD ======================= */
  const navRep = { dir: "", t: 0 };
  /* Hinweisleiste für Controller in Menüs */
  const padHint = document.createElement("div"); padHint.id = "padhint"; padHint.hidden = true; document.body.appendChild(padHint);
  let padHintKey = "";
  function syncPadHint() {
    const show = ui.modalOpen && inp.device === "pad";
    const n = k => inp.padButtonName(inp.pad[k]);
    const tabs = show && modal.querySelector(".reiter button");
    const key = show ? [n("jump"), n("roll"), ui.noEsc, !!tabs, n("s1"), n("s2"), Z.settings.lang].join("|") : "";
    if (key === padHintKey) return; padHintKey = key;
    padHint.hidden = !show; if (!show) return;
    padHint.innerHTML = "<span><kbd>" + esc(n("jump")) + "</kbd> " + L(["Auswählen", "Select"]) + "</span>" + (ui.noEsc ? "" : "<span><kbd>" + esc(n("roll")) + "</kbd> " + L(["Zurück", "Back"]) + "</span>") +
      (tabs ? "<span><kbd>" + esc(n("s1")) + "</kbd><kbd>" + esc(n("s2")) + "</kbd> " + L(["Reiter", "Tabs"]) + "</span>" : "") + "<span><kbd>◐</kbd> " + L(["Bewegen · rechter Stick blättert", "Move · right stick scrolls"]) + "</span>";
  }
  ui.frame = dt => {
    syncPadHint();
    if (!title.hidden && !ui.modalOpen) { if (inp.pressed.jump || inp.pressed.use || inp.pressed.a1) { const b = title.querySelector("button:focus") || title.querySelector("button"); if (b) b.click(); } if (inp.pressed.down || inp.pressed.up) { const bs = [...title.querySelectorAll("button")]; const i = bs.indexOf(document.activeElement); (bs[(i + (inp.pressed.down ? 1 : -1) + bs.length) % bs.length] || bs[0]).focus(); } inp.endFrame(); return; }
    if (inp.pressed.pause && !ui.choiceActive) { inp.consume("pause"); if (ui.modalOpen) { if (!ui.noEsc) closeModal(); } else ui.pause(); }
    if (inp.pressed.map && !ui.modalOpen) { inp.consume("map"); bigMap = !bigMap; drawMinimap(); }
    if (ui.modalOpen) {
      if (inp.capture) { inp.endFrame(); return; }
      if (inp.pressed.s1 || inp.pressed.s2) { const tabs = [...modal.querySelectorAll(".reiter button")]; const i = tabs.findIndex(b => b.classList.contains("an")); if (tabs.length) { const n = tabs[(i + (inp.pressed.s2 ? 1 : -1) + tabs.length) % tabs.length]; n.click(); setTimeout(() => { const f = modal.querySelector(".reiter .an"); if (f) f.focus(); }, 30); } }
      /* Gamepad in Menüs: Richtung mit Wiederholung beim Halten, A bestätigt, B zurück, rechter Stick blättert */
      const fe = document.activeElement;
      const dirNow = inp.held.up ? "u" : inp.held.down ? "d" : inp.held.left ? "l" : inp.held.right ? "r" : "";
      let fire = false;
      if (dirNow && dirNow !== navRep.dir) { navRep.dir = dirNow; navRep.t = 0.34; fire = true; }
      else if (dirNow) { navRep.t -= dt; if (navRep.t <= 0) { navRep.t = 0.085; fire = true; } }
      else navRep.dir = "";
      if (fire) {
        const d = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[dirNow];
        if (d[0] && adjustField(fe, d[0])) {} else moveDir(d[0], d[1]);
      }
      if (inp.pressed.jump || inp.pressed.a1 || inp.pressed.use) { const had = document.activeElement && modal.contains(document.activeElement) && document.activeElement !== modal; const f = ensureFocus(); if (f && had) { if (f.tagName === "SELECT") adjustField(f, 1); else f.click(); } }
      if (inp.pressed.roll && !ui.noEsc) closeModal();
      const pad = inp.lastPad; if (pad) { const ry = pad.axes[3] || 0; if (Math.abs(ry) > 0.25) { const box = modal.querySelector(".mbox"); if (box) box.scrollTop += ry * dt * 900; } }
      inp.endFrame();
      return;
    }
    choiceInput();
    if (Z.level) { updateHud(dt); bubbleTick(dt); }
  };
  /* Splitter-Anzeige: Bank im Lager */
  document.addEventListener("visibilitychange", () => { if (document.hidden && Z.level && !ui.modalOpen && Z.run) ui.pause(); });

  /* Start */
  showTitle();
})();
